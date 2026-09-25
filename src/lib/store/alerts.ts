import { create } from "zustand";
import type { Signal } from "@/lib/nukida/types";

type AlertState = {
  current: Signal | null;
  show: (signal: Signal) => void;
  dismiss: () => void;
};

export const useAlerts = create<AlertState>((set) => ({
  current: null,
  show: (current) => set({ current }),
  dismiss: () => set({ current: null }),
}));
