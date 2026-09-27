import type { Candle, Side, Signal, Zone } from "./types";
import { atr, closedOnly, lastNum } from "./indicators";
import { rrOf, zoneSl, zoneTargets } from "./risk";

export function forcedSignal(opts: {
  symbol: string;
  side: Side;
  price: number;
  candles: Candle[];
  minRr: number;
  zone?: Zone | null;
  zones?: Zone[];
}): Signal {
  const closed = closedOnly(opts.candles);
  const a = lastNum(atr(closed.length ? closed : opts.candles, 14), 1) ?? opts.price * 0.003;
  const dist = Math.max(a * 1.2, opts.price * 0.0015);
  const fromZone = opts.zone ? zoneSl(opts.price, opts.zone, opts.side, 0.001) : null;
  const sl = fromZone ?? (opts.side === "BUY" ? opts.price - dist : opts.price + dist);
  const { tp1, tp2 } = zoneTargets(opts.price, opts.side, opts.zones ?? [], sl, opts.minRr);
  const now = Date.now();
  const buy = opts.side === "BUY";
  return {
    id: `force-${opts.symbol}-${opts.side}-${now}`,
    symbol: opts.symbol,
    side: opts.side,
    strategy: "force",
    setupName: buy ? "Cưỡng bức · view MUA" : "Cưỡng bức · view BÁN",
    entry: opts.price,
    sl,
    tp1,
    tp2,
    rr: rrOf(opts.price, sl, tp1),
    slPct: Math.abs(opts.price - sl) / opts.price,
    bias: "side",
    zone: opts.zone ?? {
      lo: Math.min(opts.price, sl),
      hi: Math.max(opts.price, sl),
      kind: buy ? "bull" : "bear",
      quality: 0,
      label: "View người dùng",
    },
    checklist: [],
    requiredPass: false,
    quality: 0,
    reasons: ["Vào theo view người dùng, bỏ checklist."],
    rejects: ["Không phải setup hệ thống."],
    at: now,
    barTime: closed[closed.length - 1]?.t ?? now,
    status: "live",
  };
}
