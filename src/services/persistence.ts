import Dexie, { Table } from "dexie";
import "dexie-export-import";
import {
  Employee,
  FinanceSnapshot,
  MeetingNote,
  Mail,
  DirectMessage,
  CompanyStatus,
  CotEntry,
  DayPacket,
  PromptProfile,
  ScheduledEvent,
  TimeBranch,
  LogEntry,
  ConsistencyCheck,
} from "@/types/core";
import { logger } from "./logger";

class XiWeiDatabase extends Dexie {
  employees!: Table<Employee>;
  financeSnapshots!: Table<FinanceSnapshot>;
  meetingNotes!: Table<MeetingNote>;
  mails!: Table<Mail>;
  directMessages!: Table<DirectMessage>;
  companyStatuses!: Table<CompanyStatus>;
  cotEntries!: Table<CotEntry>;
  dayPackets!: Table<DayPacket>;
  promptProfiles!: Table<PromptProfile>;
  scheduledEvents!: Table<ScheduledEvent>;
  timeBranches!: Table<TimeBranch>;
  logEntries!: Table<LogEntry>;
  consistencyChecks!: Table<ConsistencyCheck>;

  constructor() {
    super("XiWeiPharmaDB");
    this.version(1).stores({
      employees: "id, email, site, department",
      financeSnapshots: "id, asOf",
      meetingNotes: "id, when, *tags",
      mails: "id, sentAt, from, *to, threadId",
      directMessages: "id, sentAt, from, to",
      companyStatuses: "id, asOf",
      cotEntries: "id, createdAt, role, visibility",
      dayPackets: "id, date, sentAt",
      promptProfiles: "id, name",
      scheduledEvents: "id, scheduledFor, type, executed",
      timeBranches: "id, branchedFrom, currentDate, isActive",
      logEntries: "id, timestamp, channel, level",
      consistencyChecks: "id, type, status, checkedAt",
    });
  }
}

export const db = new XiWeiDatabase();

// Initialize database and log
db.open().catch((err) => {
  logger.log("system", "error", "Failed to open database", { error: err });
});

// Export/Import utilities
export async function exportDatabase(): Promise<Blob> {
  try {
    // @ts-ignore - dexie-export-import adds these methods
    const exportData = await db.export();
    return new Blob([JSON.stringify(exportData)], { type: "application/json" });
  } catch (error) {
    logger.log("system", "error", "Failed to export database", { error });
    throw error;
  }
}

export async function importDatabase(blob: Blob): Promise<void> {
  try {
    const text = await blob.text();
    const importData = JSON.parse(text);
    // @ts-ignore - dexie-export-import adds these methods
    await db.import(importData, { overwrite: true });
    logger.log("system", "info", "Database imported successfully");
  } catch (error) {
    logger.log("system", "error", "Failed to import database", { error });
    throw error;
  }
}

export async function clearDatabase(): Promise<void> {
  try {
    await db.delete();
    await db.open();
    logger.log("system", "info", "Database cleared");
  } catch (error) {
    logger.log("system", "error", "Failed to clear database", { error });
    throw error;
  }
}

