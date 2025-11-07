import { LogEntry } from "@/types/core";
import { generateSnowflakeId, formatDate } from "@/lib/utils";

export type LogChannel = "app" | "model" | "system" | "audit";
export type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 10000;
  private listeners: Set<(entry: LogEntry) => void> = new Set();

  log(
    channel: LogChannel,
    level: LogLevel,
    message: string,
    payload?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      id: generateSnowflakeId(),
      timestamp: formatDate(new Date()),
      channel,
      level,
      message,
      payload,
      createdAt: formatDate(new Date()),
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener(entry));

    // Console output for development
    if (import.meta.env.DEV) {
      const prefix = `[${channel.toUpperCase()}]`;
      const style = this.getConsoleStyle(level);
      console.log(`%c${prefix}`, style, message, payload || "");
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    switch (level) {
      case "error":
        return "color: red; font-weight: bold";
      case "warn":
        return "color: orange; font-weight: bold";
      case "info":
        return "color: blue";
      case "debug":
        return "color: gray";
    }
  }

  subscribe(listener: (entry: LogEntry) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getLogs(filters?: {
    channel?: LogChannel;
    level?: LogLevel;
    since?: string;
  }): LogEntry[] {
    let filtered = [...this.logs];

    if (filters?.channel) {
      filtered = filtered.filter((log) => log.channel === filters.channel);
    }

    if (filters?.level) {
      filtered = filtered.filter((log) => log.level === filters.level);
    }

    if (filters?.since) {
      filtered = filtered.filter((log) => log.timestamp >= filters.since!);
    }

    return filtered;
  }

  exportNDJSON(): string {
    return this.logs.map((log) => JSON.stringify(log)).join("\n");
  }

  clear(): void {
    this.logs = [];
  }
}

export const logger = new Logger();

// Convenience functions
export const logApp = (level: LogLevel, message: string, payload?: Record<string, unknown>) =>
  logger.log("app", level, message, payload);

export const logModel = (level: LogLevel, message: string, payload?: Record<string, unknown>) =>
  logger.log("model", level, message, payload);

export const logSystem = (level: LogLevel, message: string, payload?: Record<string, unknown>) =>
  logger.log("system", level, message, payload);

export const logAudit = (level: LogLevel, message: string, payload?: Record<string, unknown>) =>
  logger.log("audit", level, message, payload);

