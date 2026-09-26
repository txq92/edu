import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_WATCH, MAX_WATCH, type SymbolId } from "@/lib/binance/constants";

type SettingsData = {
  symbol: SymbolId;
  watch: string[];
  chartTf: "1m" | "3m" | "5m" | "15m" | "1h" | "4h" | "1d";
  equity: number;
  riskPct: number;
  marginUsd: number;
  slUsd: number;
  sizeBy: "risk" | "margin";
  userView: "BUY" | "SELL";
  minRr: number;
  maxLeverage: number;
  autoPaper: boolean;
  autoLive: boolean;
  liveArmed: boolean;
  testnet: boolean;
  apiKey: string;
  apiSecret: string;
  tgToken: string;
  tgChatId: string;
  tgAlerts: boolean;
  consecutiveLossHalt: number;
  watchSeeded: boolean;
};

export type Settings = SettingsData & {
  setSymbol: (s: SymbolId) => void;
  addWatch: (id: string) => boolean;
  removeWatch: (id: string) => void;
  setChartTf: (tf: SettingsData["chartTf"]) => void;
  patch: (p: Partial<SettingsData>) => void;
};

export const useSettings = create<Settings>()(
  persist(
    (set, get) => ({
      symbol: DEFAULT_WATCH[0]!,
      watch: [...DEFAULT_WATCH],
      chartTf: "15m",
      equity: 1000,
      riskPct: 1,
      marginUsd: 100,
      slUsd: 0,
      sizeBy: "margin",
      userView: "BUY",
      minRr: 1.5,
      maxLeverage: 10,
      autoPaper: false,
      autoLive: false,
      liveArmed: false,
      testnet: false,
      apiKey: "",
      apiSecret: "",
      tgToken: "",
      tgChatId: "",
      tgAlerts: true,
      consecutiveLossHalt: 3,
      watchSeeded: false,
      setSymbol: (symbol) => set({ symbol }),
      addWatch: (id) => {
        const { watch } = get();
        if (watch.includes(id)) {
          set({ symbol: id });
          return true;
        }
        if (watch.length >= MAX_WATCH) return false;
        set({ watch: [...watch, id], symbol: id });
        return true;
      },
      removeWatch: (id) => {
        const { watch, symbol } = get();
        if (!watch.includes(id) || watch.length <= 1) return;
        const next = watch.filter((x) => x !== id);
        set({ watch: next, symbol: symbol === id ? next[0]! : symbol });
      },
      setChartTf: (chartTf) => set({ chartTf }),
      patch: (p) => set(p),
    }),
    { name: "nukida-settings", skipHydration: true },
  ),
);
