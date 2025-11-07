import { ConsistencyCheck, IsoDate, SnowflakeId } from "@/types/core";
import { generateSnowflakeId, formatDate } from "@/lib/utils";
import { db } from "./persistence";
import { logger } from "./logger";

export interface ConsistencyViolation {
  type: string;
  message: string;
  details: Record<string, unknown>;
}

class ConsistencyEngine {
  async checkFinance(date: IsoDate): Promise<ConsistencyCheck> {
    const snapshot = await db.financeSnapshots
      .where("asOf")
      .equals(date)
      .first();

    if (!snapshot) {
      return {
        id: generateSnowflakeId(),
        type: "finance",
        status: "fail",
        message: `No finance snapshot found for date ${date}`,
        checkedAt: formatDate(new Date()),
      };
    }

    const violations: ConsistencyViolation[] = [];

    // Check: cash on hand should be positive
    if (snapshot.cashOnHandUSD < 0) {
      violations.push({
        type: "negative_cash",
        message: "Cash on hand is negative",
        details: { cashOnHandUSD: snapshot.cashOnHandUSD },
      });
    }

    // Check: headcount should match employee count
    const employeeCount = await db.employees.count();
    if (snapshot.headcount !== employeeCount) {
      violations.push({
        type: "headcount_mismatch",
        message: `Headcount mismatch: snapshot says ${snapshot.headcount}, DB has ${employeeCount}`,
        details: { snapshotHeadcount: snapshot.headcount, dbHeadcount: employeeCount },
      });
    }

    // Check: burn rate consistency (should be roughly constant month-to-month)
    const previousSnapshot = await db.financeSnapshots
      .where("asOf")
      .below(date)
      .reverse()
      .first();

    if (previousSnapshot) {
      const burnDiff = Math.abs(snapshot.monthlyBurnUSD - previousSnapshot.monthlyBurnUSD);
      const burnPercentDiff = (burnDiff / previousSnapshot.monthlyBurnUSD) * 100;

      if (burnPercentDiff > 20) {
        violations.push({
          type: "burn_rate_volatility",
          message: `Monthly burn rate changed by ${burnPercentDiff.toFixed(1)}%`,
          details: {
            previousBurn: previousSnapshot.monthlyBurnUSD,
            currentBurn: snapshot.monthlyBurnUSD,
            percentChange: burnPercentDiff,
          },
        });
      }
    }

    const check: ConsistencyCheck = {
      id: generateSnowflakeId(),
      type: "finance",
      status: violations.length === 0 ? "pass" : violations.length > 2 ? "fail" : "warning",
      message: violations.length === 0
        ? "Finance consistency check passed"
        : `${violations.length} violation(s) found`,
      details: { violations },
      checkedAt: formatDate(new Date()),
    };

    await db.consistencyChecks.add(check);
    logger.log("system", violations.length === 0 ? "info" : "warn", "Finance consistency check", {
      date,
      violations: violations.length,
    });

    return check;
  }

  async checkOrg(): Promise<ConsistencyCheck> {
    const employees = await db.employees.toArray();
    const violations: ConsistencyViolation[] = [];

    // Check: all employees should have valid manager references
    const employeeIds = new Set(employees.map((e) => e.id));
    for (const emp of employees) {
      if (emp.managerId && !employeeIds.has(emp.managerId)) {
        violations.push({
          type: "invalid_manager",
          message: `Employee ${emp.name} has invalid manager reference`,
          details: { employeeId: emp.id, managerId: emp.managerId },
        });
      }
    }

    // Check: no circular manager references
    const visited = new Set<SnowflakeId>();
    const visiting = new Set<SnowflakeId>();

    function hasCycle(empId: SnowflakeId): boolean {
      if (visiting.has(empId)) return true;
      if (visited.has(empId)) return false;

      visiting.add(empId);
      const emp = employees.find((e) => e.id === empId);
      if (emp?.managerId) {
        if (hasCycle(emp.managerId)) return true;
      }
      visiting.delete(empId);
      visited.add(empId);
      return false;
    }

    for (const emp of employees) {
      if (hasCycle(emp.id)) {
        violations.push({
          type: "circular_manager",
          message: `Circular manager reference detected for ${emp.name}`,
          details: { employeeId: emp.id },
        });
      }
    }

    const check: ConsistencyCheck = {
      id: generateSnowflakeId(),
      type: "org",
      status: violations.length === 0 ? "pass" : "fail",
      message: violations.length === 0
        ? "Organization consistency check passed"
        : `${violations.length} violation(s) found`,
      details: { violations },
      checkedAt: formatDate(new Date()),
    };

    await db.consistencyChecks.add(check);
    logger.log("system", violations.length === 0 ? "info" : "warn", "Org consistency check", {
      violations: violations.length,
    });

    return check;
  }

  async checkComms(date: IsoDate): Promise<ConsistencyCheck> {
    const violations: ConsistencyViolation[] = [];

    // Check: all emails should have valid sender/receiver IDs
    const emails = await db.mails
      .where("sentAt")
      .between(date, addDays(date, 1), false, true)
      .toArray();

    const employeeIds = new Set((await db.employees.toArray()).map((e) => e.id));

    for (const email of emails) {
      if (!employeeIds.has(email.from)) {
        violations.push({
          type: "invalid_sender",
          message: `Email ${email.id} has invalid sender`,
          details: { emailId: email.id, senderId: email.from },
        });
      }

      for (const recipientId of email.to) {
        if (!employeeIds.has(recipientId)) {
          violations.push({
            type: "invalid_recipient",
            message: `Email ${email.id} has invalid recipient`,
            details: { emailId: email.id, recipientId },
          });
        }
      }
    }

    const check: ConsistencyCheck = {
      id: generateSnowflakeId(),
      type: "comms",
      status: violations.length === 0 ? "pass" : "warning",
      message: violations.length === 0
        ? "Communications consistency check passed"
        : `${violations.length} violation(s) found`,
      details: { violations },
      checkedAt: formatDate(new Date()),
    };

    await db.consistencyChecks.add(check);
    return check;
  }

  async runAllChecks(date: IsoDate): Promise<ConsistencyCheck[]> {
    const results = await Promise.all([
      this.checkFinance(date),
      this.checkOrg(),
      this.checkComms(date),
    ]);

    return results;
  }
}

function addDays(date: IsoDate, days: number): IsoDate {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

export const consistencyEngine = new ConsistencyEngine();

