import type { Side } from "./types";

type Planned = {
  side: Side;
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  rr: number;
  slPct: number;
};

export function moneySl<T extends Planned>(
  signal: T,
  opts: { marginUsd: number; leverage: number; slUsd: number; minRr: number; step?: number },
): T {
  if (!(opts.slUsd > 0) || !(opts.marginUsd > 0) || signal.entry <= 0) return signal;
  const leverage = clamp(opts.leverage, 1, 125);
  const qty = roundStep((opts.marginUsd * leverage) / signal.entry, opts.step ?? 0.001);
  if (qty <= 0) return signal;
  const dist = opts.slUsd / qty;
  const sl = signal.side === "BUY" ? signal.entry - dist : signal.entry + dist;
  if (!(sl > 0) || !Number.isFinite(sl)) return signal;
  const r1 = Math.max(0.8, opts.minRr);
  const r2 = Math.max(2.5, r1 + 1);
  const next = targets(signal.entry, sl, signal.side, r1, r2);
  return {
    ...signal,
    sl,
    tp1: next.tp1,
    tp2: next.tp2,
    rr: rrOf(signal.entry, sl, next.tp1),
    slPct: dist / signal.entry,
  };
}

export function positionSize(opts: {
  equity: number;
  riskPct: number;
  entry: number;
  sl: number;
  step?: number;
  leverage?: number;
  marginUsd?: number;
  sizeBy?: "risk" | "margin";
}): {
  qty: number;
  notional: number;
  riskUsd: number;
  slPct: number;
  leverageNeeded: number;
  marginUsd: number;
} {
  const slPct = Math.abs(opts.entry - opts.sl) / opts.entry;
  const equity = Math.max(0, opts.equity);
  const leverage = clamp(opts.leverage ?? 1, 1, 125);
  const empty = { qty: 0, notional: 0, riskUsd: 0, slPct, leverageNeeded: 0, marginUsd: 0 };
  if (slPct <= 0 || !Number.isFinite(slPct) || opts.entry <= 0) return empty;

  const riskBudget = equity * (clamp(opts.riskPct, 0, 100) / 100);
  let notional = 0;
  if (opts.sizeBy === "margin" && (opts.marginUsd ?? 0) > 0) {
    notional = opts.marginUsd! * leverage;
  } else {
    notional = riskBudget / slPct;
    const cap = Math.max(opts.marginUsd ?? 0, equity) * leverage;
    if (cap > 0 && notional > cap) notional = cap;
  }

  const step = opts.step ?? 0.001;
  const qty = roundStep(notional / opts.entry, step);
  const filled = qty * opts.entry;
  const riskUsd = filled * slPct;
  const marginUsd = leverage > 0 ? filled / leverage : filled;
  return {
    qty,
    notional: filled,
    riskUsd,
    slPct,
    leverageNeeded: equity > 0 ? filled / equity : 0,
    marginUsd,
  };
}

export function orderSize(
  settings: {
    equity: number;
    riskPct: number;
    maxLeverage: number;
    marginUsd: number;
    sizeBy: "risk" | "margin";
  },
  entry: number,
  sl: number,
  step?: number,
) {
  return positionSize({
    equity: settings.equity,
    riskPct: settings.riskPct,
    entry,
    sl,
    step,
    leverage: settings.maxLeverage,
    marginUsd: settings.marginUsd,
    sizeBy: "margin",
  });
}

function clamp(n: number, lo: number, hi: number) {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

export function roundStep(value: number, step: number): number {
  if (step <= 0) return value;
  const n = Math.floor(value / step + 1e-12) * step;
  const decimals = decimalsOf(step);
  return Number(n.toFixed(decimals));
}

export function decimalsOf(step: number): number {
  const s = step.toString();
  if (s.includes("e-")) return Number(s.split("e-")[1]);
  const i = s.indexOf(".");
  return i === -1 ? 0 : s.length - i - 1;
}

export function targets(entry: number, sl: number, side: Side, r1 = 1.5, r2 = 2.5) {
  const risk = Math.abs(entry - sl);
  if (side === "BUY") {
    return { tp1: entry + risk * r1, tp2: entry + risk * r2 };
  }
  return { tp1: entry - risk * r1, tp2: entry - risk * r2 };
}

export function rrOf(entry: number, sl: number, tp: number): number {
  const risk = Math.abs(entry - sl);
  if (risk <= 0) return 0;
  return Math.abs(tp - entry) / risk;
}

export function paddedSl(entry: number, structureSl: number, side: Side, atrVal: number): number {
  const buffer = Math.max(atrVal * 0.25, entry * 0.0006);
  if (side === "BUY") return Math.min(structureSl, entry) - buffer;
  return Math.max(structureSl, entry) + buffer;
}
