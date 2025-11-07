import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { Employee, FinanceSnapshot, IsoDate } from "@/types/core";
import { db } from "@/services/persistence";

interface CompanyState {
  employees: Employee[];
  financeSnapshots: FinanceSnapshot[];
  selectedEmployeeId: string | null;
  selectedDate: IsoDate | null;
}

interface CompanySlice extends CompanyState {
  loadEmployees: () => Promise<void>;
  loadFinanceSnapshots: () => Promise<void>;
  setSelectedEmployee: (employeeId: string | null) => void;
  setSelectedDate: (date: IsoDate | null) => void;
  getEmployee: (id: string) => Employee | undefined;
  getFinanceSnapshot: (date: IsoDate) => FinanceSnapshot | undefined;
}

export const useCompanyStore = create<CompanySlice>()(
  immer((set, get) => ({
    employees: [],
    financeSnapshots: [],
    selectedEmployeeId: null,
    selectedDate: null,

    loadEmployees: async () => {
      const employees = await db.employees.toArray();
      set((draft) => {
        draft.employees = employees;
      });
    },

    loadFinanceSnapshots: async () => {
      const snapshots = await db.financeSnapshots.toArray();
      set((draft) => {
        draft.financeSnapshots = snapshots.sort((a, b) =>
          a.asOf.localeCompare(b.asOf)
        );
      });
    },

    setSelectedEmployee: (employeeId) => {
      set((draft) => {
        draft.selectedEmployeeId = employeeId;
      });
    },

    setSelectedDate: (date) => {
      set((draft) => {
        draft.selectedDate = date;
      });
    },

    getEmployee: (id) => {
      return get().employees.find((e) => e.id === id);
    },

    getFinanceSnapshot: (date) => {
      return get().financeSnapshots.find((s) => s.asOf === date);
    },
  }))
);

