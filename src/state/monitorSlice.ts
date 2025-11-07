import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { CotEntry, SnowflakeId } from "@/types/core";
import { db } from "@/services/persistence";
import { generateSnowflakeId } from "@/lib/utils";

interface MonitorState {
  cotEntries: CotEntry[];
  selectedEmployeeId: SnowflakeId | null;
  chatHistory: Array<{
    id: SnowflakeId;
    from: SnowflakeId;
    to: SnowflakeId;
    message: string;
    timestamp: string;
    isFromModel: boolean;
    failed?: boolean;
    retryable?: boolean;
  }>;
  lastFailedMessage: {
    id: SnowflakeId;
    from: SnowflakeId;
    to: SnowflakeId;
    message: string;
    timestamp: string;
  } | null;
  pythonOutput: Array<{
    id: SnowflakeId;
    code: string;
    output: string;
    error: string;
    timestamp: string;
  }>;
}

interface MonitorSlice extends MonitorState {
  loadCotEntries: () => Promise<void>;
  addCotEntry: (entry: Omit<CotEntry, "id" | "createdAt">) => Promise<void>;
  setSelectedEmployee: (employeeId: SnowflakeId | null) => void;
  addChatMessage: (from: SnowflakeId, to: SnowflakeId, message: string, isFromModel: boolean, failed?: boolean, retryable?: boolean) => void;
  updateChatMessage: (id: SnowflakeId, updates: Partial<MonitorState["chatHistory"][0]>) => void;
  setLastFailedMessage: (message: MonitorState["lastFailedMessage"]) => void;
  addPythonOutput: (code: string, output: string, error: string) => void;
  clearChatHistory: () => void;
  clearPythonOutput: () => void;
}

export const useMonitorStore = create<MonitorSlice>()(
  immer((set) => ({
    cotEntries: [],
    selectedEmployeeId: null,
    chatHistory: [],
    lastFailedMessage: null,
    pythonOutput: [],

    loadCotEntries: async () => {
      const entries = await db.cotEntries.toArray();
      set((draft) => {
        draft.cotEntries = entries.sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt)
        );
      });
    },

    addCotEntry: async (entry) => {
      const fullEntry: CotEntry = {
        ...entry,
        id: generateSnowflakeId(),
        createdAt: new Date().toISOString(),
      };
      await db.cotEntries.add(fullEntry);
      set((draft) => {
        draft.cotEntries.push(fullEntry);
      });
    },

    setSelectedEmployee: (employeeId) => {
      set((draft) => {
        draft.selectedEmployeeId = employeeId;
      });
    },

    addChatMessage: (from, to, message, isFromModel, failed = false, retryable = false) => {
      const chatEntry = {
        id: generateSnowflakeId(),
        from,
        to,
        message,
        timestamp: new Date().toISOString(),
        isFromModel,
        failed,
        retryable,
      };
      set((draft) => {
        draft.chatHistory.push(chatEntry);
        if (failed && retryable && !isFromModel) {
          draft.lastFailedMessage = {
            id: chatEntry.id,
            from,
            to,
            message,
            timestamp: chatEntry.timestamp,
          };
        }
      });
    },

    updateChatMessage: (id, updates) => {
      set((draft) => {
        const index = draft.chatHistory.findIndex((msg) => msg.id === id);
        if (index !== -1) {
          Object.assign(draft.chatHistory[index], updates);
        }
      });
    },

    setLastFailedMessage: (message) => {
      set((draft) => {
        draft.lastFailedMessage = message;
      });
    },

    addPythonOutput: (code, output, error) => {
      const pythonEntry = {
        id: generateSnowflakeId(),
        code,
        output,
        error,
        timestamp: new Date().toISOString(),
      };
      set((draft) => {
        draft.pythonOutput.push(pythonEntry);
      });
    },

    clearChatHistory: () => {
      set((draft) => {
        draft.chatHistory = [];
      });
    },

    clearPythonOutput: () => {
      set((draft) => {
        draft.pythonOutput = [];
      });
    },
  }))
);

