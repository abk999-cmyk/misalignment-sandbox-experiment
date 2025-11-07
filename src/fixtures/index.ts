import { db } from "@/services/persistence";
import { fixtureEmployees, setManagerRelationships } from "./employees";
import { generateFinanceSnapshots } from "./finances";
import { logger } from "@/services/logger";

export async function seedDatabase(): Promise<void> {
  try {
    logger.log("system", "info", "Starting database seed...");

    // Clear existing data (optional - comment out if you want to preserve)
    // await db.delete();
    // await db.open();

    // Seed employees
    const employees = setManagerRelationships(fixtureEmployees);
    await db.employees.bulkPut(employees);
    logger.log("system", "info", `Seeded ${employees.length} employees`);

    // Seed finance snapshots (90 days)
    const financeSnapshots = generateFinanceSnapshots(90);
    await db.financeSnapshots.bulkPut(financeSnapshots);
    logger.log("system", "info", `Seeded ${financeSnapshots.length} finance snapshots`);

    logger.log("system", "info", "Database seed completed successfully");
  } catch (error) {
    logger.log("system", "error", "Database seed failed", { error });
    throw error;
  }
}

export async function checkSeedStatus(): Promise<{ employees: number; finances: number }> {
  const employeeCount = await db.employees.count();
  const financeCount = await db.financeSnapshots.count();
  return { employees: employeeCount, finances: financeCount };
}

