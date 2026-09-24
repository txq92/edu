import type { Candle, Structure, Swing, Trend, Zone } from "./types";
import { atr, lastNum, strongBody } from "./indicators";

const LEFT = 2;
const RIGHT = 2;

export function findSwings(candles: Candle[]): Swing[] {
  const swings: Swing[] = [];
  const end = candles.length - RIGHT;
  for (let i = LEFT; i < end; i++) {
    const c = candles[i];
    if (!c) continue;
    let isHigh = true;
    let isLow = true;
    for (let j = i - LEFT; j <= i + RIGHT; j++) {
      if (j === i) continue;
      const n = candles[j];
      if (!n) continue;
      if (n.h >= c.h) isHigh = false;
      if (n.l <= c.l) isLow = false;
    }
    if (isHigh) swings.push({ t: c.t, price: c.h, kind: "high", index: i });
    if (isLow) swings.push({ t: c.t, price: c.l, kind: "low", index: i });
  }
  return swings;
}

export function readStructure(candles: Candle[]): Structure {
  const swings = findSwings(candles);
  const highs = swings.filter((s) => s.kind === "high");
  const lows = swings.filter((s) => s.kind === "low");
  const h1 = highs[highs.length - 1];
  const h2 = highs[highs.length - 2];
  const l1 = lows[lows.length - 1];
  const l2 = lows[lows.length - 2];

  let trend: Trend = "side";
  if (h1 && h2 && l1 && l2) {
    const hh = h1.price > h2.price;
    const hl = l1.price > l2.price;
    const lh = h1.price < h2.price;
    const ll = l1.price < l2.price;
    if (hh && hl) trend = "up";
    else if (lh && ll) trend = "down";
  }

  const last = candles[candles.length - 1];
  let broken = false;
  let note = "Tích lũy / chưa rõ cấu trúc.";
  if (trend === "up" && last && l1) {
    broken = last.c < l1.price;
    note = broken
      ? "Cấu trúc tăng đang bị đe dọa — giá xuyên HL gần nhất."
      : "Uptrend: HH + HL. Ưu tiên mua tại vùng Bò.";
  } else if (trend === "down" && last && h1) {
    broken = last.c > h1.price;
    note = broken
      ? "Cấu trúc giảm đang bị đe dọa — giá xuyên LH gần nhất."
      : "Downtrend: LH + LL. Ưu tiên bán tại vùng Gấu.";
  }

  return {
    trend,
    swings: swings.slice(-12),
    lastHh: h1?.price,
    lastHl: l1?.price,
    lastLh: h1?.price,
    lastLl: l1?.price,
    broken,
    note,
  };
}

export function detectZones(candles: Candle[]): Zone[] {
  if (candles.length < 30) return [];
  const swings = findSwings(candles);
  const atrs = atr(candles, 14);
  const lastAtr = lastNum(atrs, 1) ?? candles[candles.length - 1]!.c * 0.003;
  const zones: Zone[] = [];

  for (let i = swings.length - 1; i >= 0 && zones.length < 4; i--) {
    const s = swings[i];
    if (!s) continue;
    const bar = candles[s.index];
    if (!bar) continue;
    const after = candles.slice(s.index, s.index + 8);
    if (after.length < 3) continue;

    if (s.kind === "low") {
      const impulse = after.some((c) => c.c > s.price + lastAtr * 1.2 && strongBody(c));
      const reaction = after.some((c) => c.c > s.price + lastAtr * 0.6);
      if (!impulse && !reaction) continue;
      const hi = Math.min(s.price + lastAtr * 0.55, bar.h);
      zones.push({
        lo: s.price,
        hi: Math.max(hi, s.price * 1.0008),
        kind: "bull",
        quality: impulse ? 80 : 60,
        label: "Vùng Bò",
      });
    } else {
      const impulse = after.some((c) => c.c < s.price - lastAtr * 1.2 && strongBody(c));
      const reaction = after.some((c) => c.c < s.price - lastAtr * 0.6);
      if (!impulse && !reaction) continue;
      const lo = Math.max(s.price - lastAtr * 0.55, bar.l);
      zones.push({
        lo: Math.min(lo, s.price * 0.9992),
        hi: s.price,
        kind: "bear",
        quality: impulse ? 80 : 60,
        label: "Vùng Gấu",
      });
    }
  }

  return zones;
}

export function inZone(price: number, zone: Zone, padPct = 0.0006): boolean {
  return price >= zone.lo * (1 - padPct) && price <= zone.hi * (1 + padPct);
}

export function nearestZone(price: number, zones: Zone[], kind?: Zone["kind"]): Zone | null {
  const list = kind ? zones.filter((z) => z.kind === kind) : zones;
  if (!list.length) return null;
  return list.reduce((best, z) => {
    const mid = (z.lo + z.hi) / 2;
    const bestMid = (best.lo + best.hi) / 2;
    return Math.abs(price - mid) < Math.abs(price - bestMid) ? z : best;
  });
}

export function exhaustedMove(candles: Candle[], side: "BUY" | "SELL"): boolean {
  if (candles.length < 16) return false;
  const atrs = atr(candles, 14);
  const a = lastNum(atrs, 1);
  const last = candles[candles.length - 1];
  if (!a || !last) return false;
  const window = candles.slice(-10);
  if (side === "BUY") {
    const low = Math.min(...window.map((c) => c.l));
    const consecutiveUp = window.filter((c) => c.c > c.o).length >= 7;
    return last.c - low > a * 3.4 && consecutiveUp;
  }
  const high = Math.max(...window.map((c) => c.h));
  const consecutiveDn = window.filter((c) => c.c < c.o).length >= 7;
  return high - last.c > a * 3.4 && consecutiveDn;
}

export function findRangeBox(
  candles: Candle[],
  minBars = 8,
  maxBars = 28,
  maxPct = 0.007,
): { hi: number; lo: number; start: number; end: number } | null {
  if (candles.length < minBars + 2) return null;
  for (let len = maxBars; len >= minBars; len--) {
    const slice = candles.slice(-len - 1, -1);
    if (slice.length < minBars) continue;
    const hi = Math.max(...slice.map((c) => c.h));
    const lo = Math.min(...slice.map((c) => c.l));
    const mid = (hi + lo) / 2;
    if (mid <= 0) continue;
    const pct = (hi - lo) / mid;
    if (pct > 0.0018 && pct <= maxPct) {
      return { hi, lo, start: slice[0]!.t, end: slice[slice.length - 1]!.t };
    }
  }
  return null;
}
