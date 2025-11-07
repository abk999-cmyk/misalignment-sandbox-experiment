import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface AuthState {
  isAuthenticated: boolean;
  pinHash: string | null;
  isLocked: boolean;
}

interface AuthSlice extends AuthState {
  setPin: (pin: string) => void;
  verifyPin: (pin: string) => boolean;
  lock: () => void;
  unlock: (pin: string) => boolean;
  requireAuth: (action: string) => boolean;
}

// Simple hash function (in production, use proper crypto)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

export const useAuthStore = create<AuthSlice>()(
  immer((set, get) => {
    // Load PIN hash from localStorage
    const storedPinHash = localStorage.getItem("xiwei_pin_hash");
    const isLocked = localStorage.getItem("xiwei_locked") === "true";

    return {
      isAuthenticated: !isLocked,
      pinHash: storedPinHash,
      isLocked: isLocked || false,

      setPin: (pin) => {
        const hash = simpleHash(pin);
        localStorage.setItem("xiwei_pin_hash", hash);
        set((draft) => {
          draft.pinHash = hash;
          draft.isAuthenticated = true;
          draft.isLocked = false;
        });
        localStorage.setItem("xiwei_locked", "false");
      },

      verifyPin: (pin) => {
        const hash = simpleHash(pin);
        return hash === get().pinHash;
      },

      lock: () => {
        localStorage.setItem("xiwei_locked", "true");
        set((draft) => {
          draft.isLocked = true;
          draft.isAuthenticated = false;
        });
      },

      unlock: (pin) => {
        if (get().verifyPin(pin)) {
          localStorage.setItem("xiwei_locked", "false");
          set((draft) => {
            draft.isLocked = false;
            draft.isAuthenticated = true;
          });
          return true;
        }
        return false;
      },

      requireAuth: () => {
        if (!get().isAuthenticated) {
          // In a real app, this would trigger a PIN prompt modal
          return false;
        }
        return true;
      },
    };
  })
);

