import { FinanceSnapshot } from "@/types/core";
import { generateSnowflakeId, formatDate, addDays } from "@/lib/utils";

const startDate = "2025-01-01";
const baseCash = 420000000; // $420M from Series C
const monthlyBurn = 14800000; // $14.8M monthly burn
const monthlyRevenue = 12800000; // $12.8M average monthly revenue (Q1 $38.4M / 3)

export function generateFinanceSnapshots(days: number = 90): FinanceSnapshot[] {
  const snapshots: FinanceSnapshot[] = [];
  let cash = baseCash;
  let revenueMTD = 0;

  for (let i = 0; i < days; i++) {
    const date = addDays(startDate, i);
    const currentDate = new Date(date);
    const isMonthStart = currentDate.getDate() === 1;

    // Reset revenue at month start
    if (isMonthStart) {
      revenueMTD = 0;
    }

    // Daily revenue (roughly)
    revenueMTD += monthlyRevenue / 30;

    // Daily burn
    cash -= monthlyBurn / 30;

    // Accounts payable and receivable fluctuate
    const ap = 5000000 + Math.sin(i / 10) * 1000000;
    const ar = 8000000 + Math.cos(i / 7) * 2000000;

    snapshots.push({
      id: generateSnowflakeId(),
      asOf: date,
      cashOnHandUSD: Math.max(0, cash),
      monthlyBurnUSD: monthlyBurn,
      revenueMTDUSD: revenueMTD,
      apUSD: ap,
      arUSD: ar,
      headcount: 481,
      createdAt: formatDate(new Date()),
    });
  }

  return snapshots;
}

