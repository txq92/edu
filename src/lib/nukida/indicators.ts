import type { Candle } from "./types";

export function closes(candles: Candle[]): number[] {
  return candles.map((c) => c.c);
}

export function sma(values: number[], period: number): Array<number | null> {
  const out: Array<number | null> = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i] ?? 0;
    if (i >= period) sum -= values[i - period] ?? 0;
    out.push(i >= period - 1 ? sum / period : null);
  }
  return out;
}

export function ema(values: number[], period: number): Array<number | null> {
  const k = 2 / (period + 1);
  const out: Array<number | null> = [];
  let prev: number | null = null;
  let seed = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i] ?? 0;
    if (i < period) {
      seed += v;
      if (i === period - 1) {
        prev = seed / period;
        out.push(prev);
      } else {
        out.push(null);
      }
    } else {
      prev = v * k + (prev as number) * (1 - k);
      out.push(prev);
    }
  }
  return out;
}

export function rma(values: number[], period: number): Array<number | null> {
  const out: Array<number | null> = [];
  let prev: number | null = null;
  let seed = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i] ?? 0;
    if (i < period) {
      seed += v;
      if (i === period - 1) {
        prev = seed / period;
        out.push(prev);
      } else {
        out.push(null);
      }
    } else {
      prev = ((prev as number) * (period - 1) + v) / period;
      out.push(prev);
    }
  }
  return out;
}

export function trueRange(candles: Candle[]): number[] {
  return candles.map((c, i) => {
    if (i === 0) return c.h - c.l;
    const prev = candles[i - 1]?.c ?? c.c;
    return Math.max(c.h - c.l, Math.abs(c.h - prev), Math.abs(c.l - prev));
  });
}

export function atr(candles: Candle[], period = 14): Array<number | null> {
  return rma(trueRange(candles), period);
}

export function lastNum(series: Array<number | null>, offset = 1): number | null {
  const i = series.length - offset;
  if (i < 0) return null;
  return series[i] ?? null;
}

export function slope(series: Array<number | null>, lookback = 5): number | null {
  const a = lastNum(series, lookback);
  const b = lastNum(series, 1);
  if (a == null || b == null || a === 0) return null;
  return (b - a) / a;
}

export function sessionVwap(candles: Candle[]): Array<number | null> {
  const out: Array<number | null> = [];
  let pv = 0;
  let vol = 0;
  let day = -1;
  for (const c of candles) {
    const d = Math.floor(c.t / 86_400_000);
    if (d !== day) {
      pv = 0;
      vol = 0;
      day = d;
    }
    const tp = (c.h + c.l + c.c) / 3;
    pv += tp * c.v;
    vol += c.v;
    out.push(vol > 0 ? pv / vol : tp);
  }
  return out;
}

export function volumeSma(candles: Candle[], period = 20): Array<number | null> {
  return sma(
    candles.map((c) => c.v),
    period,
  );
}

export function nearFunding(now: number, windowMin = 15): boolean {
  const d = new Date(now);
  const minutes = d.getUTCHours() * 60 + d.getUTCMinutes();
  const slots = [0, 8 * 60, 16 * 60];
  const window = windowMin;
  return slots.some((s) => {
    let dist = Math.abs(minutes - s);
    dist = Math.min(dist, 24 * 60 - dist);
    return dist <= window;
  });
}

export function closedOnly(candles: Candle[]): Candle[] {
  if (!candles.length) return candles;
  const last = candles[candles.length - 1];
  if (last && !last.closed) return candles.slice(0, -1);
  return candles;
}

export function body(c: Candle): number {
  return Math.abs(c.c - c.o);
}

export function range(c: Candle): number {
  return Math.max(c.h - c.l, 1e-12);
}

export function upperWick(c: Candle): number {
  return c.h - Math.max(c.o, c.c);
}

export function lowerWick(c: Candle): number {
  return Math.min(c.o, c.c) - c.l;
}

export function isBull(c: Candle): boolean {
  return c.c >= c.o;
}

export function bullRejection(c: Candle): boolean {
  const r = range(c);
  return lowerWick(c) / r >= 0.45 && c.c > (c.h + c.l) / 2;
}

export function bearRejection(c: Candle): boolean {
  const r = range(c);
  return upperWick(c) / r >= 0.45 && c.c < (c.h + c.l) / 2;
}

export function bullEngulf(prev: Candle, cur: Candle): boolean {
  return isBull(cur) && !isBull(prev) && cur.c >= prev.o && cur.o <= prev.c && body(cur) > body(prev);
}

export function bearEngulf(prev: Candle, cur: Candle): boolean {
  return !isBull(cur) && isBull(prev) && cur.c <= prev.o && cur.o >= prev.c && body(cur) > body(prev);
}

export function strongBody(c: Candle): boolean {
  return body(c) / range(c) >= 0.55;
}
