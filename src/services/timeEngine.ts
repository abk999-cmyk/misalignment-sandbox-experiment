import { TimeBranch, IsoDate, SnowflakeId } from "@/types/core";
import { generateSnowflakeId, formatDate, addDays } from "@/lib/utils";
import { db } from "./persistence";
import { logger } from "./logger";

export interface TimeState {
  currentDate: IsoDate;
  startDate: IsoDate;
  isPaused: boolean;
  activeBranch: SnowflakeId | null;
  branches: TimeBranch[];
}

class TimeEngine {
  private state: TimeState = {
    currentDate: formatDate(new Date()),
    startDate: formatDate(new Date()),
    isPaused: true,
    activeBranch: null,
    branches: [],
  };

  private listeners: Set<(state: TimeState) => void> = new Set();

  async initialize(startDate?: IsoDate): Promise<void> {
    const date = startDate || formatDate(new Date());
    this.state.currentDate = date;
    this.state.startDate = date;
    this.state.isPaused = true;

    // Load branches from DB
    const branches = await db.timeBranches.toArray();
    const activeBranch = branches.find((b) => b.isActive);
    this.state.branches = branches;
    this.state.activeBranch = activeBranch?.id || null;

    if (activeBranch) {
      this.state.currentDate = activeBranch.currentDate;
    }

    this.notifyListeners();
    logger.log("system", "info", "Time engine initialized", { date });
  }

  getState(): TimeState {
    return { ...this.state };
  }

  getCurrentDate(): IsoDate {
    return this.state.currentDate;
  }

  async tick(days: number = 1): Promise<void> {
    if (this.state.isPaused) {
      logger.log("system", "warn", "Cannot tick while paused");
      return;
    }

    const newDate = addDays(this.state.currentDate, days);
    await this.jumpTo(newDate);
  }

  async jumpTo(date: IsoDate): Promise<void> {
    this.state.currentDate = date;

    if (this.state.activeBranch) {
      const branch = await db.timeBranches.get(this.state.activeBranch);
      if (branch) {
        branch.currentDate = date;
        await db.timeBranches.update(this.state.activeBranch, branch);
      }
    }

    this.notifyListeners();
    logger.log("system", "info", "Time jumped", { date });
  }

  async createBranch(name: string, fromDate?: IsoDate): Promise<SnowflakeId> {
    const branchDate = fromDate || this.state.currentDate;
    const branch: TimeBranch = {
      id: generateSnowflakeId(),
      name,
      branchedFrom: branchDate,
      currentDate: branchDate,
      isActive: false,
      createdAt: formatDate(new Date()),
    };

    await db.timeBranches.add(branch);
    this.state.branches.push(branch);
    this.notifyListeners();
    logger.log("system", "info", "Branch created", { branchId: branch.id, name });
    return branch.id;
  }

  async switchBranch(branchId: SnowflakeId): Promise<void> {
    // Deactivate current branch
    if (this.state.activeBranch) {
      const currentBranch = await db.timeBranches.get(this.state.activeBranch);
      if (currentBranch) {
        currentBranch.isActive = false;
        await db.timeBranches.update(this.state.activeBranch, currentBranch);
      }
    }

    // Activate new branch
    const branch = await db.timeBranches.get(branchId);
    if (!branch) {
      throw new Error(`Branch ${branchId} not found`);
    }

    branch.isActive = true;
    await db.timeBranches.update(branchId, branch);

    this.state.activeBranch = branchId;
    this.state.currentDate = branch.currentDate;
    this.notifyListeners();
    logger.log("system", "info", "Switched branch", { branchId });
  }

  async rollbackTo(date: IsoDate): Promise<void> {
    // This is a destructive operation - should be logged
    logger.log("audit", "warn", "Time rollback initiated", { date, from: this.state.currentDate });
    
    // Delete all data after this date
    // Note: In a real implementation, you'd want to be more careful about this
    await this.jumpTo(date);
  }

  pause(): void {
    this.state.isPaused = true;
    this.notifyListeners();
    logger.log("system", "info", "Time paused");
  }

  resume(): void {
    this.state.isPaused = false;
    this.notifyListeners();
    logger.log("system", "info", "Time resumed");
  }

  subscribe(listener: (state: TimeState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.getState()));
  }
}

export const timeEngine = new TimeEngine();

