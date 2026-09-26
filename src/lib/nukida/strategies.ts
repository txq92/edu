import type { Candle, Side, Signal, StrategyId, Zone } from "./types";
import {
  atr,
  bearEngulf,
  bearRejection,
  bullEngulf,
  bullRejection,
  closedOnly,
  ema,
  lastNum,
  nearFunding,
  sessionVwap,
  slope,
  volumeSma,
} from "./indicators";
import { detectZones, exhaustedMove, findRangeBox, inZone, nearestZone, readStructure } from "./structure";
import { paddedSl, rrOf, targets, zoneSl } from "./risk";
import { DEFAULT_RULES, type RuleConfig } from "./rules";

export type MarketPack = {
  symbol: string;
  tf5: Candle[];
  tf15: Candle[];
  tfH1: Candle[];
  tfH4: Candle[];
  now?: number;
};

type RawSetup = {
  side: Side;
  strategy: StrategyId;
  setupName: string;
  entry: number;
  slRaw: number;
  zone: Zone;
  reasons: string[];
  rejects: string[];
};

function lastClosed(c: Candle[]): Candle | null {
  const x = closedOnly(c);
  return x[x.length - 1] ?? null;
}

function prevClosed(c: Candle[]): Candle | null {
  const x = closedOnly(c);
  return x[x.length - 2] ?? null;
}

function reversal(side: Side, cur: Candle, prev: Candle | null): boolean {
  if (side === "BUY") {
    return bullRejection(cur) || (prev ? bullEngulf(prev, cur) : false) || (cur.c > cur.o && cur.c > (cur.h + cur.l) / 2);
  }
  return bearRejection(cur) || (prev ? bearEngulf(prev, cur) : false) || (cur.c < cur.o && cur.c < (cur.h + cur.l) / 2);
}

function htfAllows(pack: MarketPack, side: Side): { ok: boolean; trend: "up" | "down" | "side"; note: string } {
  const h4 = readStructure(closedOnly(pack.tfH4.length ? pack.tfH4 : pack.tfH1));
  const h1 = readStructure(closedOnly(pack.tfH1.length ? pack.tfH1 : pack.tf15));
  const trend = h4.trend === "side" ? h1.trend : h4.trend;
  if (side === "BUY" && trend === "down") {
    return { ok: false, trend, note: "Khung lớn H4/H1 đang giảm — không mua." };
  }
  if (side === "SELL" && trend === "up") {
    return { ok: false, trend, note: "Khung lớn H4/H1 đang tăng — không bán." };
  }
  return { ok: true, trend, note: h4.trend === "side" ? h1.note : h4.note };
}

export function higherTrend(pack: MarketPack): "up" | "down" | "side" {
  return htfAllows(pack, "BUY").trend;
}

export function frameZones(pack: MarketPack): Zone[] {
  const tag = (candles: Candle[], tf: string) =>
    detectZones(closedOnly(candles)).map((z) => ({
      ...z,
      label: `${tf} ${z.kind === "bull" ? "Bò" : "Gấu"}`,
    }));
  return [...tag(pack.tfH4, "H4"), ...tag(pack.tfH1, "H1")];
}

export function zoneHit(pack: MarketPack, side: Side, price: number, sensitivity: number): Zone | null {
  const trend = htfAllows(pack, side).trend;
  const aligned = side === "BUY" ? trend === "up" : trend === "down";
  if (!aligned) return null;
  const kind = side === "BUY" ? "bull" : "bear";
  const pad = 0.0015 * sensitivity;
  return frameZones(pack).find((z) => z.kind === kind && inZone(price, z, pad)) ?? null;
}

export function scanBreakout(pack: MarketPack, rules: RuleConfig = DEFAULT_RULES): RawSetup | null {
  const tf15 = closedOnly(pack.tf15);
  const tf5 = closedOnly(pack.tf5);
  const box = findRangeBox(tf15);
  if (!box) return null;
  const last15 = lastClosed(tf15);
  const vol = volumeSma(tf15, 20);
  const v = lastNum(vol, 1);
  if (!last15 || v == null) return null;

  const confirmedUp = tf15.slice(-3).some((c) => c.c > box.hi);
  const confirmedDn = tf15.slice(-3).some((c) => c.c < box.lo);
  if (!confirmedUp && !confirmedDn) return null;

  const side: Side = confirmedUp && !confirmedDn ? "BUY" : confirmedDn && !confirmedUp ? "SELL" : last15.c >= box.hi ? "BUY" : "SELL";
  const last5 = lastClosed(tf5);
  const prev5 = prevClosed(tf5);
  if (!last5) return null;

  const edge = side === "BUY" ? box.hi : box.lo;
  const dist = Math.abs(last5.c - edge) / edge;
  const wickHold = side === "BUY" ? last5.l >= box.hi * 0.9978 : last5.h <= box.lo * 1.0022;
  const distMax = 0.0024 * rules.sensitivity;
  const retesting = dist <= distMax && wickHold;
  if (!retesting) return null;
  if (!reversal(side, last5, prev5)) return null;

  const fake =
    side === "BUY" ? tf5.slice(-4).some((c) => c.c < box.hi * 0.997) : tf5.slice(-4).some((c) => c.c > box.lo * 1.003);
  if (fake) return null;

  const zone: Zone =
    side === "BUY"
      ? { lo: box.hi * 0.999, hi: box.hi * 1.0008, kind: "bull", quality: 78, label: "Mép hộp breakout" }
      : { lo: box.lo * 0.9992, hi: box.lo * 1.001, kind: "bear", quality: 78, label: "Mép hộp breakdown" };

  return {
    side,
    strategy: "breakout",
    setupName: side === "BUY" ? "Breakout + retest lên" : "Breakdown + retest xuống",
    entry: last5.c,
    slRaw: side === "BUY" ? Math.min(last5.l, box.hi) : Math.max(last5.h, box.lo),
    zone,
    reasons: ["15m phá hộp kèm lực", "5m retest mép hộp giữ được", "Không đuổi nến phá đầu tiên"],
    rejects: [],
  };
}

export function scanEmaPullback(pack: MarketPack, rules: RuleConfig = DEFAULT_RULES): RawSetup | null {
  const tf15 = closedOnly(pack.tf15);
  const tf5 = closedOnly(pack.tf5);
  const c15 = tf15.map((x) => x.c);
  const e9 = ema(c15, 9);
  const e21 = ema(c15, 21);
  const a9 = lastNum(e9, 1);
  const b9 = lastNum(e9, 2);
  const a21 = lastNum(e21, 1);
  const s21 = slope(e21, 6);
  const last15 = lastClosed(tf15);
  const last5 = lastClosed(tf5);
  const prev5 = prevClosed(tf5);
  if (!a9 || !a21 || !s21 || !last15 || !last5) return null;

  const slopeMin = 0.00015 / rules.sensitivity;
  const stackedUp = a9 > a21 && (b9 ?? a9) >= a21 && last15.c > a21 && s21 > slopeMin;
  const stackedDn = a9 < a21 && (b9 ?? a9) <= a21 && last15.c < a21 && s21 < -slopeMin;
  if (!stackedUp && !stackedDn) return null;

  const crossedRecently = tf15.slice(-8).some((_, i) => {
    const idx = e9.length - 8 + i;
    const x = e9[idx];
    const y = e21[idx];
    const px = e9[idx - 1];
    const py = e21[idx - 1];
    if (x == null || y == null || px == null || py == null) return false;
    return (px - py) * (x - y) < 0;
  });
  if (rules.sensitivity < 2.4 && crossedRecently) return null;

  const side: Side = stackedUp ? "BUY" : "SELL";
  const dist = Math.abs(last5.c - a21) / a21;
  const pad = 0.0016 * rules.sensitivity;
  const touched =
    side === "BUY"
      ? last5.l <= a21 * (1 + pad) && last5.c >= a21 * (1 - pad * 0.75)
      : last5.h >= a21 * (1 - pad) && last5.c <= a21 * (1 + pad * 0.75);
  if (!touched && dist > 0.0022 * rules.sensitivity) return null;
  if (!reversal(side, last5, prev5)) return null;
  if (side === "BUY" && last5.c < a21 * 0.9975) return null;
  if (side === "SELL" && last5.c > a21 * 1.0025) return null;

  const zone: Zone =
    side === "BUY"
      ? { lo: a21 * 0.9985, hi: a21 * 1.0015, kind: "bull", quality: 72, label: "Hồi EMA21" }
      : { lo: a21 * 0.9985, hi: a21 * 1.0015, kind: "bear", quality: 72, label: "Hồi EMA21" };

  return {
    side,
    strategy: "ema",
    setupName: side === "BUY" ? "Pullback EMA 9/21 mua" : "Pullback EMA 9/21 bán",
    entry: last5.c,
    slRaw: side === "BUY" ? last5.l : last5.h,
    zone,
    reasons: [
      stackedUp ? "15m EMA9 > EMA21, dốc lên" : "15m EMA9 < EMA21, dốc xuống",
      "Giá hồi về EMA21",
      "5m có nến đảo chiều giữ EMA",
    ],
    rejects: [],
  };
}

export function scanVwap(pack: MarketPack, rules: RuleConfig = DEFAULT_RULES): RawSetup | null {
  const now = pack.now ?? Date.now();
  if (rules.fundingFilter && nearFunding(now, rules.fundingWindowMin)) return null;
  const tf5 = closedOnly(pack.tf5);
  const tf15 = closedOnly(pack.tf15);
  const vw = sessionVwap(tf5);
  const vNow = lastNum(vw, 1);
  const last5 = lastClosed(tf5);
  const prev5 = prevClosed(tf5);
  const last15 = lastClosed(tf15);
  if (!vNow || !last5 || !last15) return null;

  const above = last15.c > vNow && last5.c >= vNow;
  const below = last15.c < vNow && last5.c <= vNow;
  if (!above && !below) return null;

  const side: Side = above ? "BUY" : "SELL";
  const dist = Math.abs(last5.c - vNow) / vNow;
  const pad = 0.0018 * rules.sensitivity;
  const tagged =
    side === "BUY" ? last5.l <= vNow * (1 + pad) && last5.c >= vNow : last5.h >= vNow * (1 - pad) && last5.c <= vNow;
  if (!tagged && dist > 0.002 * rules.sensitivity) return null;
  if (!reversal(side, last5, prev5)) return null;
  if (side === "BUY" && last5.c < vNow) return null;
  if (side === "SELL" && last5.c > vNow) return null;

  const zone: Zone =
    side === "BUY"
      ? { lo: vNow * 0.9988, hi: vNow * 1.0015, kind: "bull", quality: 70, label: "VWAP phiên" }
      : { lo: vNow * 0.9985, hi: vNow * 1.0012, kind: "bear", quality: 70, label: "VWAP phiên" };

  return {
    side,
    strategy: "vwap",
    setupName: side === "BUY" ? "Hồi VWAP — long" : "Hồi VWAP — short",
    entry: last5.c,
    slRaw: side === "BUY" ? Math.min(last5.l, vNow) : Math.max(last5.h, vNow),
    zone,
    reasons: [
      side === "BUY" ? "Giá trên VWAP phiên" : "Giá dưới VWAP phiên",
      "Hồi sát VWAP rồi giữ",
      "Xa giờ funding",
    ],
    rejects: [],
  };
}

function toSignal(pack: MarketPack, raw: RawSetup, rules: RuleConfig, qualityBoost = 0): Signal | null {
  const allow = htfAllows(pack, raw.side);
  const tf15 = closedOnly(pack.tf15);
  const tf5 = closedOnly(pack.tf5);
  const last = lastClosed(tf5);
  if (!last) return null;
  const a = lastNum(atr(tf5, 14), 1) ?? last.c * 0.002;
  const hit = zoneHit(pack, raw.side, raw.entry, rules.sensitivity);
  const sl = (hit && zoneSl(raw.entry, hit, raw.side, 0.001)) || paddedSl(raw.entry, raw.slRaw, raw.side, a);
  const r1 = rules.minRr;
  const r2 = Math.max(2.5, r1 + 1);
  const { tp1, tp2 } = targets(raw.entry, sl, raw.side, r1, r2);
  const rr = rrOf(raw.entry, sl, tp1);
  const zones = frameZones(pack);
  const struct = readStructure(closedOnly(pack.tfH4.length ? pack.tfH4 : pack.tfH1));
  const zone = hit ?? nearestZone(raw.entry, zones, raw.side === "BUY" ? "bull" : "bear") ?? raw.zone;
  const tired = exhaustedMove(tf15, raw.side);
  const funding = nearFunding(pack.now ?? Date.now(), rules.fundingWindowMin);

  const rejects = [...raw.rejects];
  if (rules.requireHtf && allow.trend !== (raw.side === "BUY" ? "up" : "down")) {
    rejects.push(allow.trend === "side" ? "Khung lớn H4/H1 chưa có hướng — đứng ngoài." : allow.note);
  }
  if (!hit) rejects.push("5m chưa về vùng Bò/Gấu của H1 hoặc H4 cùng chiều khung lớn.");
  if (rules.blockExhausted && tired) rejects.push("Sóng kéo dài, kiệt sức trên khung 15m.");
  if (rr + 0.02 < rules.minRr) rejects.push(`R:R ${rr.toFixed(2)} < ${rules.minRr} — bỏ.`);
  if (rules.fundingFilter && funding) rejects.push("Gần giờ funding — đứng ngoài.");

  const requiredPass = rejects.length === 0;
  let quality = (hit?.quality ?? raw.zone.quality) + qualityBoost;
  if (allow.trend === (raw.side === "BUY" ? "up" : "down")) quality += 8;
  if (hit) quality += 6;
  if (!requiredPass) quality = Math.min(quality, rules.minQuality - 1);
  quality = Math.max(0, Math.min(100, quality));

  return {
    id: `${pack.symbol}-${raw.strategy}-${last.t}-${raw.side}`,
    symbol: pack.symbol,
    side: raw.side,
    strategy: raw.strategy,
    setupName: raw.setupName,
    entry: raw.entry,
    sl,
    tp1,
    tp2,
    rr,
    slPct: Math.abs(raw.entry - sl) / raw.entry,
    bias: struct.trend,
    zone,
    checklist: [],
    requiredPass,
    quality,
    reasons: raw.reasons,
    rejects,
    at: pack.now ?? Date.now(),
    barTime: last.t,
    status: requiredPass ? "live" : "watch",
  };
}

export function scanSetups(pack: MarketPack, rules: RuleConfig = DEFAULT_RULES): Signal[] {
  const raws = [scanBreakout(pack, rules), scanEmaPullback(pack, rules), scanVwap(pack, rules)].filter(
    (x): x is RawSetup => Boolean(x),
  );
  if (!raws.length) return [];

  const sameSide = raws.length >= 2 && raws.every((r) => r.side === raws[0]!.side);
  const signals: Signal[] = [];
  if (sameSide && raws.length >= 2) {
    const base = raws.reduce((a, b) => (a.strategy === "breakout" ? a : b));
    const merged: RawSetup = {
      ...base,
      strategy: "confluence",
      setupName: `Hội tụ ${raws.map((r) => r.strategy.toUpperCase()).join(" + ")}`,
      reasons: [...new Set(raws.flatMap((r) => r.reasons))],
      rejects: [],
    };
    const s = toSignal(pack, merged, rules, 12);
    if (s) signals.push(s);
  }
  for (const r of raws) {
    const s = toSignal(pack, r, rules);
    if (s) signals.push(s);
  }
  const seen = new Set<string>();
  return signals.filter((s) => {
    const k = s.strategy + s.side;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function biasOf(pack: MarketPack): {
  trend15: "up" | "down" | "side";
  trendH4: "up" | "down" | "side";
  emaStack: "up" | "down" | "flat";
  vsVwap: "above" | "below" | "flat";
  note: string;
} {
  const tf15 = closedOnly(pack.tf15);
  const tf5 = closedOnly(pack.tf5);
  const s15 = readStructure(tf15);
  const sH = readStructure(closedOnly(pack.tfH4.length ? pack.tfH4 : pack.tfH1));
  const e9 = ema(
    tf15.map((c) => c.c),
    9,
  );
  const e21 = ema(
    tf15.map((c) => c.c),
    21,
  );
  const a9 = lastNum(e9, 1);
  const a21 = lastNum(e21, 1);
  let emaStack: "up" | "down" | "flat" = "flat";
  if (a9 && a21) {
    if (a9 > a21 * 1.0003) emaStack = "up";
    else if (a9 < a21 * 0.9997) emaStack = "down";
  }
  const vw = lastNum(sessionVwap(tf5), 1);
  const last = lastClosed(tf5);
  let vsVwap: "above" | "below" | "flat" = "flat";
  if (vw && last) {
    if (last.c > vw * 1.0003) vsVwap = "above";
    else if (last.c < vw * 0.9997) vsVwap = "below";
  }
  const longBias = emaStack === "up" && vsVwap === "above" && sH.trend !== "down";
  const shortBias = emaStack === "down" && vsVwap === "below" && sH.trend !== "up";
  const note = longBias
    ? "Khung lớn tăng. Chỉ long khi 5m về vùng Bò H1/H4."
    : shortBias
      ? "Khung lớn giảm. Chỉ short khi 5m về vùng Gấu H1/H4."
      : "Khung lớn chưa cùng chiều vùng Bò/Gấu — đứng ngoài.";
  return { trend15: s15.trend, trendH4: sH.trend, emaStack, vsVwap, note };
}
