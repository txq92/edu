import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PaperBook } from "@/lib/cloud/types";
import type { JournalEntry, Position, Signal, Ticker } from "@/lib/nukida/types";
import { formatDateTime, todayKey } from "@/lib/nukida/format";
import { positionSize } from "@/lib/nukida/risk";

type PaperState = {
  cash: number;
  startEquity: number;
  positions: Position[];
  history: Position[];
  haltUntil: number;
  lossesToday: number;
  lastLossDay: string;
  placeFromSignal: (
    signal: Signal,
    opts: {
      equity: number;
      riskPct: number;
      step?: number;
      mode?: "paper" | "live";
      leverage?: number;
      marginUsd?: number;
      sizeBy?: "risk" | "margin";
      force?: boolean;
    },
  ) => Position | null;
  tick: (tickers: Ticker[]) => void;
  close: (id: string, price: number, reason: string) => void;
  reset: (equity: number) => void;
  resume: () => void;
};

function journalFrom(signal: Signal, riskPct: number): JournalEntry {
  return {
    date: formatDateTime(signal.at),
    product: signal.symbol,
    side: signal.side,
    skeletonTf: "H4 / H1",
    entryTf: "M15 bias / M5 vào",
    htfTrend: signal.bias,
    zone: `${signal.zone.label} ${signal.zone.lo.toFixed(2)}–${signal.zone.hi.toFixed(2)}`,
    candleForce: signal.reasons.join("; "),
    reason: signal.setupName,
    entry: signal.entry,
    sl: signal.sl,
    tp1: signal.tp1,
    tp2: signal.tp2,
    rr: signal.rr,
    riskPct,
    checklistOk: signal.requiredPass,
  };
}

function pnlAt(pos: Position, price: number): number {
  const dir = pos.side === "BUY" ? 1 : -1;
  return (price - pos.entry) * dir * pos.remainingQty;
}

export const usePaper = create<PaperState>()(
  persist(
    (set, get) => ({
      cash: 1000,
      startEquity: 1000,
      positions: [],
      history: [],
      haltUntil: 0,
      lossesToday: 0,
      lastLossDay: "",
      placeFromSignal: (signal, opts) => {
        const state = get();
        if (Date.now() < state.haltUntil && !opts.force) return null;
        if (state.positions.some((p) => p.symbol === signal.symbol && p.status !== "closed")) return null;
        const size = positionSize({
          equity: opts.equity,
          riskPct: opts.riskPct,
          entry: signal.entry,
          sl: signal.sl,
          step: opts.step ?? 0.001,
          leverage: opts.leverage,
          marginUsd: opts.marginUsd,
          sizeBy: opts.sizeBy,
        });
        if (size.qty <= 0) return null;
        const pos: Position = {
          id: `${signal.symbol}-${signal.at}`,
          symbol: signal.symbol,
          side: signal.side,
          strategy: signal.strategy,
          setupName: signal.setupName,
          entry: signal.entry,
          sl: signal.sl,
          tp1: signal.tp1,
          tp2: signal.tp2,
          qty: size.qty,
          remainingQty: size.qty,
          notional: size.notional,
          marginUsd: size.marginUsd,
          leverage: opts.leverage,
          riskUsd: size.riskUsd,
          riskPct: opts.riskPct,
          rr: signal.rr,
          status: "open",
          openedAt: Date.now(),
          realizedPnl: 0,
          mode: opts.mode ?? "paper",
          slMovedToBe: false,
          journal: journalFrom(signal, opts.riskPct),
        };
        set({ positions: [...state.positions, pos] });
        return pos;
      },
      tick: (tickers) => {
        const map = new Map(tickers.map((t) => [t.symbol, t.price]));
        const day = todayKey();
        let lossesToday = get().lastLossDay === day ? get().lossesToday : 0;
        const still: Position[] = [];
        const closed: Position[] = [];

        for (const pos of get().positions) {
          const price = map.get(pos.symbol);
          if (price == null) {
            still.push(pos);
            continue;
          }
          let next = { ...pos };
          const dir = pos.side === "BUY" ? 1 : -1;
          const hitSl = pos.side === "BUY" ? price <= next.sl : price >= next.sl;
          const hitTp2 = pos.side === "BUY" ? price >= next.tp2 : price <= next.tp2;
          const hitTp1 = pos.side === "BUY" ? price >= next.tp1 : price <= next.tp1;

          if (hitSl) {
            const pnl = (next.sl - next.entry) * dir * next.remainingQty;
            next = {
              ...next,
              remainingQty: 0,
              status: "closed",
              closedAt: Date.now(),
              slAt: Date.now(),
              realizedPnl: next.realizedPnl + pnl,
              journal: { ...next.journal, result: `SL ${pnl.toFixed(2)}`, ruleOk: true },
            };
            closed.push(next);
            if (pnl < 0) lossesToday += 1;
            continue;
          }

          if (hitTp2) {
            const pnl = (next.tp2 - next.entry) * dir * next.remainingQty;
            next = {
              ...next,
              remainingQty: 0,
              status: "closed",
              closedAt: Date.now(),
              tp1At: next.tp1At ?? Date.now(),
              tp2At: Date.now(),
              realizedPnl: next.realizedPnl + pnl,
              journal: { ...next.journal, result: `TP2 ${pnl.toFixed(2)}`, ruleOk: true },
            };
            closed.push(next);
            continue;
          }

          if (hitTp1 && next.status === "open") {
            const half = next.remainingQty / 2;
            const pnl = (next.tp1 - next.entry) * dir * half;
            next = {
              ...next,
              remainingQty: next.remainingQty - half,
              status: "partial",
              realizedPnl: next.realizedPnl + pnl,
              sl: next.entry,
              slMovedToBe: true,
              tp1At: next.tp1At ?? Date.now(),
              journal: { ...next.journal, result: `TP1 50% ${pnl.toFixed(2)}` },
            };
          }
          still.push(next);
        }

        const haltUntil = lossesToday >= 3 ? Date.now() + 12 * 3600_000 : get().haltUntil;
        const realized = closed.reduce((a, p) => a + p.realizedPnl, 0);
        set({
          positions: still,
          history: [...closed, ...get().history].slice(0, 200),
          cash: get().cash + realized,
          lossesToday,
          lastLossDay: day,
          haltUntil,
        });
      },
      close: (id, price, reason) => {
        const pos = get().positions.find((p) => p.id === id);
        if (!pos) return;
        const pnl = pnlAt(pos, price);
        const done: Position = {
          ...pos,
          remainingQty: 0,
          status: "closed",
          closedAt: Date.now(),
          realizedPnl: pos.realizedPnl + pnl,
          journal: { ...pos.journal, result: `${reason} ${pnl.toFixed(2)}`, ruleOk: true },
        };
        set({
          positions: get().positions.filter((p) => p.id !== id),
          history: [done, ...get().history].slice(0, 200),
          cash: get().cash + pnl,
        });
      },
      reset: (equity) =>
        set({
          cash: equity,
          startEquity: equity,
          positions: [],
          history: [],
          haltUntil: 0,
          lossesToday: 0,
        }),
      resume: () => set({ haltUntil: 0, lossesToday: 0 }),
    }),
    { name: "nukida-paper", skipHydration: true },
  ),
);

export function readBook(): PaperBook {
  const s = usePaper.getState();
  return {
    cash: s.cash,
    startEquity: s.startEquity,
    positions: s.positions,
    history: s.history,
    haltUntil: s.haltUntil,
    lossesToday: s.lossesToday,
    lastLossDay: s.lastLossDay,
  };
}

export function writeBook(book: PaperBook) {
  usePaper.setState({
    cash: book.cash,
    startEquity: book.startEquity,
    positions: book.positions,
    history: book.history,
    haltUntil: book.haltUntil,
    lossesToday: book.lossesToday,
    lastLossDay: book.lastLossDay,
  });
}

export function paperEquity(cash: number, positions: Position[], tickers: Ticker[]): number {
  const map = new Map(tickers.map((t) => [t.symbol, t.price]));
  const u = positions.reduce((acc, p) => {
    const px = map.get(p.symbol) ?? p.entry;
    return acc + pnlAt(p, px);
  }, 0);
  return cash + u;
}
