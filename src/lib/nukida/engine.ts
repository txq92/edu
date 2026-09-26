import type { Candle, ReplayResult, Side, Signal } from "./types";
import { attachChecklist } from "./checklist";
import { closedOnly } from "./indicators";
import { moneySl, positionSize } from "./risk";
import { scanSetups, type MarketPack } from "./strategies";
import { DEFAULT_RULES, type RuleConfig } from "./rules";

export function analyze(pack: MarketPack, rules: RuleConfig = DEFAULT_RULES): Signal[] {
  const signals = scanSetups(pack, rules).map((s) => attachChecklist(s, pack, rules));
  return signals.sort((a, b) => b.quality - a.quality);
}

export function bestLive(signals: Signal[], minQuality = DEFAULT_RULES.minQuality): Signal | null {
  return signals.find((s) => s.requiredPass && s.quality >= minQuality) ?? null;
}

export function replay(pack: MarketPack, step = 3, rules: RuleConfig = DEFAULT_RULES): ReplayResult[] {
  const tf5 = closedOnly(pack.tf5);
  const tf15 = closedOnly(pack.tf15);
  const tfH1 = closedOnly(pack.tfH1);
  const tfH4 = closedOnly(pack.tfH4);
  if (tf5.length < 80 || tf15.length < 40) return [];

  const out: ReplayResult[] = [];
  let cooldownUntil = 0;
  const start = Math.max(60, tf5.length - 180);

  for (let i = start; i < tf5.length - 8; i += step) {
    const bar = tf5[i];
    if (!bar || bar.t < cooldownUntil) continue;
    const slice5 = tf5.slice(0, i + 1);
    const slice15 = tf15.filter((c) => c.t <= bar.t);
    const sliceH1 = tfH1.filter((c) => c.t <= bar.t);
    const sliceH4 = tfH4.filter((c) => c.t <= bar.t);
    const signals = analyze({
      symbol: pack.symbol,
      tf5: slice5,
      tf15: slice15,
      tfH1: sliceH1,
      tfH4: sliceH4,
      now: bar.t + 5 * 60 * 1000,
    }, rules).filter((s) => s.requiredPass && s.quality >= rules.minQuality);
    const sig = signals[0];
    if (!sig) continue;
    const future = tf5.slice(i + 1, i + 48);
    const scored = scoreForward(sig, future);
    out.push(scored);
    cooldownUntil = bar.t + 45 * 60 * 1000;
    if (out.length >= 12) break;
  }
  return out;
}

function scoreForward(signal: Signal, future: Candle[]): ReplayResult {
  const risk = Math.abs(signal.entry - signal.sl);
  let mfeR = 0;
  let maeR = 0;
  let outcome: ReplayResult["outcome"] = "open";
  for (const c of future) {
    if (signal.side === "BUY") {
      maeR = Math.max(maeR, (signal.entry - c.l) / risk);
      mfeR = Math.max(mfeR, (c.h - signal.entry) / risk);
      if (c.l <= signal.sl) {
        outcome = "sl";
        break;
      }
      if (c.h >= signal.tp2) {
        outcome = "tp2";
        break;
      }
      if (c.h >= signal.tp1) outcome = "tp1";
    } else {
      maeR = Math.max(maeR, (c.h - signal.entry) / risk);
      mfeR = Math.max(mfeR, (signal.entry - c.l) / risk);
      if (c.h >= signal.sl) {
        outcome = "sl";
        break;
      }
      if (c.l <= signal.tp2) {
        outcome = "tp2";
        break;
      }
      if (c.l <= signal.tp1) outcome = "tp1";
    }
  }
  return {
    signal: { ...signal, status: "historical" },
    outcome,
    mfeR,
    maeR,
  };
}

export function replayStats(rows: ReplayResult[]) {
  const done = rows.filter((r) => r.outcome !== "open");
  const wins = done.filter((r) => r.outcome === "tp1" || r.outcome === "tp2");
  const wr = done.length ? (wins.length / done.length) * 100 : 0;
  const expectancy =
    done.length === 0
      ? 0
      : done.reduce((acc, r) => {
          if (r.outcome === "sl") return acc - 1;
          if (r.outcome === "tp2") return acc + 2.5;
          if (r.outcome === "tp1") return acc + 1.5;
          return acc;
        }, 0) / done.length;
  return { count: rows.length, done: done.length, wins: wins.length, wr, expectancy };
}

export type BacktestTrade = {
  symbol: string;
  side: Side;
  setupName: string;
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  at: number;
  outcome: "sl" | "tp1" | "tp2" | "open";
  pnl: number;
  r: number;
};

export function backtestPack(
  pack: MarketPack,
  rules: RuleConfig,
  sizing: { marginUsd: number; leverage: number; slUsd: number; step: number; equity: number },
  stride = 3,
): BacktestTrade[] {
  const tf5 = closedOnly(pack.tf5);
  const tf15 = closedOnly(pack.tf15);
  const tfH1 = closedOnly(pack.tfH1);
  const tfH4 = closedOnly(pack.tfH4);
  if (tf5.length < 80 || tf15.length < 40) return [];

  const out: BacktestTrade[] = [];
  let cooldownUntil = 0;
  const start = 80;

  for (let i = start; i < tf5.length - 2; i += Math.max(1, stride)) {
    const bar = tf5[i];
    if (!bar || bar.t < cooldownUntil) continue;
    const signals = analyze(
      {
        symbol: pack.symbol,
        tf5: tf5.slice(0, i + 1),
        tf15: tf15.filter((c) => c.t <= bar.t),
        tfH1: tfH1.filter((c) => c.t <= bar.t),
        tfH4: tfH4.filter((c) => c.t <= bar.t),
        now: bar.t + 5 * 60 * 1000,
      },
      rules,
    ).filter((s) => s.requiredPass && s.quality >= rules.minQuality);
    const raw = signals[0];
    if (!raw) continue;
    const planned = moneySl(raw, {
      marginUsd: sizing.marginUsd,
      leverage: sizing.leverage,
      slUsd: sizing.slUsd,
      minRr: rules.minRr,
      step: sizing.step,
    });
    const size = positionSize({
      equity: sizing.equity,
      riskPct: 1,
      entry: planned.entry,
      sl: planned.sl,
      step: sizing.step,
      leverage: sizing.leverage,
      marginUsd: sizing.marginUsd,
      sizeBy: "margin",
    });
    if (size.qty <= 0) continue;
    const future = tf5.slice(i + 1, i + 289);
    const settled = settle(planned, future, size.qty, size.riskUsd);
    out.push({
      symbol: planned.symbol,
      side: planned.side,
      setupName: planned.setupName,
      entry: planned.entry,
      sl: planned.sl,
      tp1: planned.tp1,
      tp2: planned.tp2,
      at: bar.t,
      ...settled,
    });
    cooldownUntil = bar.t + 60 * 60 * 1000;
    if (out.length >= 40) break;
  }
  return out;
}

function settle(signal: Signal, future: Candle[], qty: number, riskUsd: number): Pick<BacktestTrade, "outcome" | "pnl" | "r"> {
  const dir = signal.side === "BUY" ? 1 : -1;
  let sl = signal.sl;
  let remain = qty;
  let pnl = 0;
  let tookTp1 = false;
  for (const c of future) {
    const hitSl = signal.side === "BUY" ? c.l <= sl : c.h >= sl;
    const hitTp2 = signal.side === "BUY" ? c.h >= signal.tp2 : c.l <= signal.tp2;
    const hitTp1 = !tookTp1 && (signal.side === "BUY" ? c.h >= signal.tp1 : c.l <= signal.tp1);
    if (hitSl) {
      pnl += (sl - signal.entry) * dir * remain;
      const outcome = tookTp1 ? "tp1" : "sl";
      return { outcome, pnl, r: riskUsd > 0 ? pnl / riskUsd : 0 };
    }
    if (hitTp2) {
      pnl += (signal.tp2 - signal.entry) * dir * remain;
      return { outcome: "tp2", pnl, r: riskUsd > 0 ? pnl / riskUsd : 0 };
    }
    if (hitTp1) {
      const half = remain / 2;
      pnl += (signal.tp1 - signal.entry) * dir * half;
      remain -= half;
      sl = signal.entry;
      tookTp1 = true;
    }
  }
  const last = future[future.length - 1];
  if (last && remain > 0) pnl += (last.c - signal.entry) * dir * remain;
  return { outcome: tookTp1 ? "tp1" : "open", pnl, r: riskUsd > 0 ? pnl / riskUsd : 0 };
}
