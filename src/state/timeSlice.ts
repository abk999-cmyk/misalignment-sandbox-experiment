import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { IsoDate, SnowflakeId, TimeBranch } from "@/types/core";
import { timeEngine } from "@/services/timeEngine";
import { formatDate } from "@/lib/utils";

interface TimeSlice {
  // TimeState properties
  currentDate: IsoDate;
  startDate: IsoDate;
  isPaused: boolean;
  activeBranch: SnowflakeId | null;
  branches: TimeBranch[];
  // Methods
  initialize: (startDate?: IsoDate) => Promise<void>;
  tick: (days?: number) => Promise<void>;
  jumpTo: (date: IsoDate) => Promise<void>;
  createBranch: (name: string, fromDate?: IsoDate) => Promise<SnowflakeId>;
  switchBranch: (branchId: SnowflakeId) => Promise<void>;
  rollbackTo: (date: IsoDate) => Promise<void>;
  pause: () => void;
  resume: () => void;
}

export const useTimeStore = create<TimeSlice>()(
  immer((set) => {
    // Subscribe to time engine changes
    timeEngine.subscribe((state) => {
      set((draft) => {
        Object.assign(draft, state);
      });
    });

    return {
      currentDate: formatDate(new Date()),
      startDate: formatDate(new Date()),
      isPaused: true,
      activeBranch: null,
      branches: [],

      initialize: async (startDate) => {
        await timeEngine.initialize(startDate);
        set((draft) => {
          Object.assign(draft, timeEngine.getState());
        });
      },

      tick: async (days) => {
        await timeEngine.tick(days);
      },

      jumpTo: async (date) => {
        await timeEngine.jumpTo(date);
      },

      createBranch: async (name, fromDate) => {
        const branchId = await timeEngine.createBranch(name, fromDate);
        set((draft) => {
          draft.branches = timeEngine.getState().branches;
        });
        return branchId;
      },

      switchBranch: async (branchId) => {
        await timeEngine.switchBranch(branchId);
      },

      rollbackTo: async (date) => {
        await timeEngine.rollbackTo(date);
      },

      pause: () => {
        timeEngine.pause();
      },

      resume: () => {
        timeEngine.resume();
      },
    };
  })
);

