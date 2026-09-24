import { n as create } from "../_libs/zustand.mjs";
import { a as paddedSl, c as rrOf, l as targets } from "./router-CM6PRVh4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/market-M5kH7E49.js
function sma(values, period) {
	const out = [];
	let sum = 0;
	for (let i = 0; i < values.length; i++) {
		sum += values[i] ?? 0;
		if (i >= period) sum -= values[i - period] ?? 0;
		out.push(i >= period - 1 ? sum / period : null);
	}
	return out;
}
function ema(values, period) {
	const k = 2 / (period + 1);
	const out = [];
	let prev = null;
	let seed = 0;
	for (let i = 0; i < values.length; i++) {
		const v = values[i] ?? 0;
		if (i < period) {
			seed += v;
			if (i === period - 1) {
				prev = seed / period;
				out.push(prev);
			} else out.push(null);
		} else {
			prev = v * k + prev * (1 - k);
			out.push(prev);
		}
	}
	return out;
}
function rma(values, period) {
	const out = [];
	let prev = null;
	let seed = 0;
	for (let i = 0; i < values.length; i++) {
		const v = values[i] ?? 0;
		if (i < period) {
			seed += v;
			if (i === period - 1) {
				prev = seed / period;
				out.push(prev);
			} else out.push(null);
		} else {
			prev = (prev * (period - 1) + v) / period;
			out.push(prev);
		}
	}
	return out;
}
function trueRange(candles) {
	return candles.map((c, i) => {
		if (i === 0) return c.h - c.l;
		const prev = candles[i - 1]?.c ?? c.c;
		return Math.max(c.h - c.l, Math.abs(c.h - prev), Math.abs(c.l - prev));
	});
}
function atr(candles, period = 14) {
	return rma(trueRange(candles), period);
}
function lastNum(series, offset = 1) {
	const i = series.length - offset;
	if (i < 0) return null;
	return series[i] ?? null;
}
function slope(series, lookback = 5) {
	const a = lastNum(series, lookback);
	const b = lastNum(series, 1);
	if (a == null || b == null || a === 0) return null;
	return (b - a) / a;
}
function sessionVwap(candles) {
	const out = [];
	let pv = 0;
	let vol = 0;
	let day = -1;
	for (const c of candles) {
		const d = Math.floor(c.t / 864e5);
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
function volumeSma(candles, period = 20) {
	return sma(candles.map((c) => c.v), period);
}
function nearFunding(now, windowMin = 15) {
	const d = new Date(now);
	const minutes = d.getUTCHours() * 60 + d.getUTCMinutes();
	const slots = [
		0,
		480,
		960
	];
	const window = windowMin;
	return slots.some((s) => {
		let dist = Math.abs(minutes - s);
		dist = Math.min(dist, 1440 - dist);
		return dist <= window;
	});
}
function closedOnly(candles) {
	if (!candles.length) return candles;
	const last = candles[candles.length - 1];
	if (last && !last.closed) return candles.slice(0, -1);
	return candles;
}
function body(c) {
	return Math.abs(c.c - c.o);
}
function range(c) {
	return Math.max(c.h - c.l, 1e-12);
}
function upperWick(c) {
	return c.h - Math.max(c.o, c.c);
}
function lowerWick(c) {
	return Math.min(c.o, c.c) - c.l;
}
function isBull(c) {
	return c.c >= c.o;
}
function bullRejection(c) {
	const r = range(c);
	return lowerWick(c) / r >= .45 && c.c > (c.h + c.l) / 2;
}
function bearRejection(c) {
	const r = range(c);
	return upperWick(c) / r >= .45 && c.c < (c.h + c.l) / 2;
}
function bullEngulf(prev, cur) {
	return isBull(cur) && !isBull(prev) && cur.c >= prev.o && cur.o <= prev.c && body(cur) > body(prev);
}
function bearEngulf(prev, cur) {
	return !isBull(cur) && isBull(prev) && cur.c <= prev.o && cur.o >= prev.c && body(cur) > body(prev);
}
function strongBody(c) {
	return body(c) / range(c) >= .55;
}
var LEFT = 2;
var RIGHT = 2;
function findSwings(candles) {
	const swings = [];
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
		if (isHigh) swings.push({
			t: c.t,
			price: c.h,
			kind: "high",
			index: i
		});
		if (isLow) swings.push({
			t: c.t,
			price: c.l,
			kind: "low",
			index: i
		});
	}
	return swings;
}
function readStructure(candles) {
	const swings = findSwings(candles);
	const highs = swings.filter((s) => s.kind === "high");
	const lows = swings.filter((s) => s.kind === "low");
	const h1 = highs[highs.length - 1];
	const h2 = highs[highs.length - 2];
	const l1 = lows[lows.length - 1];
	const l2 = lows[lows.length - 2];
	let trend = "side";
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
		note = broken ? "Cấu trúc tăng đang bị đe dọa — giá xuyên HL gần nhất." : "Uptrend: HH + HL. Ưu tiên mua tại vùng Bò.";
	} else if (trend === "down" && last && h1) {
		broken = last.c > h1.price;
		note = broken ? "Cấu trúc giảm đang bị đe dọa — giá xuyên LH gần nhất." : "Downtrend: LH + LL. Ưu tiên bán tại vùng Gấu.";
	}
	return {
		trend,
		swings: swings.slice(-12),
		lastHh: h1?.price,
		lastHl: l1?.price,
		lastLh: h1?.price,
		lastLl: l1?.price,
		broken,
		note
	};
}
function detectZones(candles) {
	if (candles.length < 30) return [];
	const swings = findSwings(candles);
	const lastAtr = lastNum(atr(candles, 14), 1) ?? candles[candles.length - 1].c * .003;
	const zones = [];
	for (let i = swings.length - 1; i >= 0 && zones.length < 4; i--) {
		const s = swings[i];
		if (!s) continue;
		const bar = candles[s.index];
		if (!bar) continue;
		const after = candles.slice(s.index, s.index + 8);
		if (after.length < 3) continue;
		if (s.kind === "low") {
			const impulse = after.some((c) => c.c > s.price + lastAtr * 1.2 && strongBody(c));
			const reaction = after.some((c) => c.c > s.price + lastAtr * .6);
			if (!impulse && !reaction) continue;
			const hi = Math.min(s.price + lastAtr * .55, bar.h);
			zones.push({
				lo: s.price,
				hi: Math.max(hi, s.price * 1.0008),
				kind: "bull",
				quality: impulse ? 80 : 60,
				label: "Vùng Bò"
			});
		} else {
			const impulse = after.some((c) => c.c < s.price - lastAtr * 1.2 && strongBody(c));
			const reaction = after.some((c) => c.c < s.price - lastAtr * .6);
			if (!impulse && !reaction) continue;
			const lo = Math.max(s.price - lastAtr * .55, bar.l);
			zones.push({
				lo: Math.min(lo, s.price * .9992),
				hi: s.price,
				kind: "bear",
				quality: impulse ? 80 : 60,
				label: "Vùng Gấu"
			});
		}
	}
	return zones;
}
function inZone(price, zone, padPct = 6e-4) {
	return price >= zone.lo * (1 - padPct) && price <= zone.hi * (1 + padPct);
}
function nearestZone(price, zones, kind) {
	const list = kind ? zones.filter((z) => z.kind === kind) : zones;
	if (!list.length) return null;
	return list.reduce((best, z) => {
		const mid = (z.lo + z.hi) / 2;
		const bestMid = (best.lo + best.hi) / 2;
		return Math.abs(price - mid) < Math.abs(price - bestMid) ? z : best;
	});
}
function exhaustedMove(candles, side) {
	if (candles.length < 16) return false;
	const a = lastNum(atr(candles, 14), 1);
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
function findRangeBox(candles, minBars = 8, maxBars = 28, maxPct = .007) {
	if (candles.length < minBars + 2) return null;
	for (let len = maxBars; len >= minBars; len--) {
		const slice = candles.slice(-len - 1, -1);
		if (slice.length < minBars) continue;
		const hi = Math.max(...slice.map((c) => c.h));
		const lo = Math.min(...slice.map((c) => c.l));
		const mid = (hi + lo) / 2;
		if (mid <= 0) continue;
		const pct = (hi - lo) / mid;
		if (pct > .0018 && pct <= maxPct) return {
			hi,
			lo,
			start: slice[0].t,
			end: slice[slice.length - 1].t
		};
	}
	return null;
}
function lastClosed(c) {
	const x = closedOnly(c);
	return x[x.length - 1] ?? null;
}
function prevClosed(c) {
	const x = closedOnly(c);
	return x[x.length - 2] ?? null;
}
function reversal(side, cur, prev) {
	if (side === "BUY") return bullRejection(cur) || (prev ? bullEngulf(prev, cur) : false) || cur.c > cur.o && cur.c > (cur.h + cur.l) / 2;
	return bearRejection(cur) || (prev ? bearEngulf(prev, cur) : false) || cur.c < cur.o && cur.c < (cur.h + cur.l) / 2;
}
function htfAllows(pack, side) {
	const h4 = readStructure(closedOnly(pack.tfH4.length ? pack.tfH4 : pack.tfH1));
	const h1 = readStructure(closedOnly(pack.tfH1.length ? pack.tfH1 : pack.tf15));
	const trend = h4.trend === "side" ? h1.trend : h4.trend;
	if (side === "BUY" && trend === "down") return {
		ok: false,
		trend,
		note: "Khung xương đang giảm — không mua."
	};
	if (side === "SELL" && trend === "up") return {
		ok: false,
		trend,
		note: "Khung xương đang tăng — không bán."
	};
	return {
		ok: true,
		trend,
		note: h4.note
	};
}
function scanBreakout(pack) {
	const tf15 = closedOnly(pack.tf15);
	const tf5 = closedOnly(pack.tf5);
	const box = findRangeBox(tf15);
	if (!box) return null;
	const last15 = lastClosed(tf15);
	const v = lastNum(volumeSma(tf15, 20), 1);
	if (!last15 || v == null) return null;
	const confirmedUp = tf15.slice(-3).some((c) => c.c > box.hi);
	const confirmedDn = tf15.slice(-3).some((c) => c.c < box.lo);
	if (!confirmedUp && !confirmedDn) return null;
	const side = confirmedUp && !confirmedDn ? "BUY" : confirmedDn && !confirmedUp ? "SELL" : last15.c >= box.hi ? "BUY" : "SELL";
	const last5 = lastClosed(tf5);
	const prev5 = prevClosed(tf5);
	if (!last5) return null;
	const edge = side === "BUY" ? box.hi : box.lo;
	const dist = Math.abs(last5.c - edge) / edge;
	const wickHold = side === "BUY" ? last5.l >= box.hi * .9978 : last5.h <= box.lo * 1.0022;
	if (!(dist <= .0024 && wickHold)) return null;
	if (!reversal(side, last5, prev5)) return null;
	if (side === "BUY" ? tf5.slice(-4).some((c) => c.c < box.hi * .997) : tf5.slice(-4).some((c) => c.c > box.lo * 1.003)) return null;
	const zone = side === "BUY" ? {
		lo: box.hi * .999,
		hi: box.hi * 1.0008,
		kind: "bull",
		quality: 78,
		label: "Mép hộp breakout"
	} : {
		lo: box.lo * .9992,
		hi: box.lo * 1.001,
		kind: "bear",
		quality: 78,
		label: "Mép hộp breakdown"
	};
	return {
		side,
		strategy: "breakout",
		setupName: side === "BUY" ? "Breakout + retest lên" : "Breakdown + retest xuống",
		entry: last5.c,
		slRaw: side === "BUY" ? Math.min(last5.l, box.hi) : Math.max(last5.h, box.lo),
		zone,
		reasons: [
			"15m phá hộp kèm lực",
			"5m retest mép hộp giữ được",
			"Không đuổi nến phá đầu tiên"
		],
		rejects: []
	};
}
function scanEmaPullback(pack) {
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
	const stackedUp = a9 > a21 && (b9 ?? a9) >= a21 && last15.c > a21 && s21 > 15e-5;
	const stackedDn = a9 < a21 && (b9 ?? a9) <= a21 && last15.c < a21 && s21 < -15e-5;
	if (!stackedUp && !stackedDn) return null;
	if (tf15.slice(-8).some((_, i) => {
		const idx = e9.length - 8 + i;
		const x = e9[idx];
		const y = e21[idx];
		const px = e9[idx - 1];
		const py = e21[idx - 1];
		if (x == null || y == null || px == null || py == null) return false;
		return (px - py) * (x - y) < 0;
	})) return null;
	const side = stackedUp ? "BUY" : "SELL";
	const dist = Math.abs(last5.c - a21) / a21;
	if (!(side === "BUY" ? last5.l <= a21 * 1.0016 && last5.c >= a21 * .9988 : last5.h >= a21 * .9984 && last5.c <= a21 * 1.0012) && dist > .0022) return null;
	if (!reversal(side, last5, prev5)) return null;
	if (side === "BUY" && last5.c < a21 * .9975) return null;
	if (side === "SELL" && last5.c > a21 * 1.0025) return null;
	const zone = side === "BUY" ? {
		lo: a21 * .9985,
		hi: a21 * 1.0015,
		kind: "bull",
		quality: 72,
		label: "Hồi EMA21"
	} : {
		lo: a21 * .9985,
		hi: a21 * 1.0015,
		kind: "bear",
		quality: 72,
		label: "Hồi EMA21"
	};
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
			"5m có nến đảo chiều giữ EMA"
		],
		rejects: []
	};
}
function scanVwap(pack) {
	if (nearFunding(pack.now ?? Date.now(), 12)) return null;
	const tf5 = closedOnly(pack.tf5);
	const tf15 = closedOnly(pack.tf15);
	const vNow = lastNum(sessionVwap(tf5), 1);
	const last5 = lastClosed(tf5);
	const prev5 = prevClosed(tf5);
	const last15 = lastClosed(tf15);
	if (!vNow || !last5 || !last15) return null;
	const above = last15.c > vNow && last5.c >= vNow;
	const below = last15.c < vNow && last5.c <= vNow;
	if (!above && !below) return null;
	const side = above ? "BUY" : "SELL";
	const dist = Math.abs(last5.c - vNow) / vNow;
	if (!(side === "BUY" ? last5.l <= vNow * 1.0018 && last5.c >= vNow : last5.h >= vNow * .9982 && last5.c <= vNow) && dist > .002) return null;
	if (!reversal(side, last5, prev5)) return null;
	if (side === "BUY" && last5.c < vNow) return null;
	if (side === "SELL" && last5.c > vNow) return null;
	const zone = side === "BUY" ? {
		lo: vNow * .9988,
		hi: vNow * 1.0015,
		kind: "bull",
		quality: 70,
		label: "VWAP phiên"
	} : {
		lo: vNow * .9985,
		hi: vNow * 1.0012,
		kind: "bear",
		quality: 70,
		label: "VWAP phiên"
	};
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
			"Xa giờ funding"
		],
		rejects: []
	};
}
function toSignal(pack, raw, qualityBoost = 0) {
	const allow = htfAllows(pack, raw.side);
	const tf15 = closedOnly(pack.tf15);
	const tf5 = closedOnly(pack.tf5);
	const last = lastClosed(tf5);
	if (!last) return null;
	const a = lastNum(atr(tf5, 14), 1) ?? last.c * .002;
	const sl = paddedSl(raw.entry, raw.slRaw, raw.side, a);
	const { tp1, tp2 } = targets(raw.entry, sl, raw.side, 1.5, 2.5);
	const rr = rrOf(raw.entry, sl, tp1);
	const zones = detectZones(tf15);
	const struct = readStructure(tf15);
	const zone = raw.zone ?? nearestZone(raw.entry, zones, raw.side === "BUY" ? "bull" : "bear");
	const tired = exhaustedMove(tf15, raw.side);
	const funding = nearFunding(pack.now ?? Date.now());
	const atZone = raw.strategy === "ema" || raw.strategy === "vwap" || raw.strategy === "breakout" || (zone ? inZone(raw.entry, zone, .002) : false);
	const rejects = [...raw.rejects];
	if (!allow.ok) rejects.push(allow.note);
	if (tired) rejects.push("Sóng kéo dài, kiệt sức trên khung 15m.");
	if (rr < 1.5) rejects.push(`R:R ${rr.toFixed(2)} < 1.5 — bỏ.`);
	if (funding) rejects.push("Gần giờ funding — đứng ngoài.");
	if (!atZone) rejects.push("Chưa đứng tại vùng Bò/Gấu chất lượng.");
	const requiredPass = rejects.length === 0 && allow.ok && rr >= 1.5 && !tired && !funding;
	let quality = raw.zone.quality + qualityBoost;
	if (allow.trend === (raw.side === "BUY" ? "up" : "down")) quality += 8;
	if (atZone) quality += 6;
	if (!requiredPass) quality = Math.min(quality, 68);
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
		zone: zone ?? raw.zone,
		checklist: [],
		requiredPass,
		quality,
		reasons: raw.reasons,
		rejects,
		at: pack.now ?? Date.now(),
		barTime: last.t,
		status: requiredPass ? "live" : "watch"
	};
}
function scanSetups(pack) {
	const raws = [
		scanBreakout(pack),
		scanEmaPullback(pack),
		scanVwap(pack)
	].filter((x) => Boolean(x));
	if (!raws.length) return [];
	const sameSide = raws.length >= 2 && raws.every((r) => r.side === raws[0].side);
	const signals = [];
	if (sameSide && raws.length >= 2) {
		const s = toSignal(pack, {
			...raws.reduce((a, b) => a.strategy === "breakout" ? a : b),
			strategy: "confluence",
			setupName: `Hội tụ ${raws.map((r) => r.strategy.toUpperCase()).join(" + ")}`,
			reasons: [...new Set(raws.flatMap((r) => r.reasons))],
			rejects: []
		}, 12);
		if (s) signals.push(s);
	}
	for (const r of raws) {
		const s = toSignal(pack, r);
		if (s) signals.push(s);
	}
	const seen = /* @__PURE__ */ new Set();
	return signals.filter((s) => {
		const k = s.strategy + s.side;
		if (seen.has(k)) return false;
		seen.add(k);
		return true;
	});
}
function biasOf(pack) {
	const tf15 = closedOnly(pack.tf15);
	const tf5 = closedOnly(pack.tf5);
	const s15 = readStructure(tf15);
	const sH = readStructure(closedOnly(pack.tfH4.length ? pack.tfH4 : pack.tfH1));
	const e9 = ema(tf15.map((c) => c.c), 9);
	const e21 = ema(tf15.map((c) => c.c), 21);
	const a9 = lastNum(e9, 1);
	const a21 = lastNum(e21, 1);
	let emaStack = "flat";
	if (a9 && a21) {
		if (a9 > a21 * 1.0003) emaStack = "up";
		else if (a9 < a21 * .9997) emaStack = "down";
	}
	const vw = lastNum(sessionVwap(tf5), 1);
	const last = lastClosed(tf5);
	let vsVwap = "flat";
	if (vw && last) {
		if (last.c > vw * 1.0003) vsVwap = "above";
		else if (last.c < vw * .9997) vsVwap = "below";
	}
	const longBias = emaStack === "up" && vsVwap === "above" && sH.trend !== "down";
	const shortBias = emaStack === "down" && vsVwap === "below" && sH.trend !== "up";
	const note = longBias ? "Bias 15m: chỉ long. Chờ hồi vùng Bò / EMA21 / VWAP." : shortBias ? "Bias 15m: chỉ short. Chờ hồi vùng Gấu / EMA21 / VWAP." : "Bias không sạch — ưu tiên đứng ngoài.";
	return {
		trend15: s15.trend,
		trendH4: sH.trend,
		emaStack,
		vsVwap,
		note
	};
}
function buildChecklist(signal, pack) {
	const side = signal.side;
	const buy = side === "BUY";
	const bias = biasOf(pack);
	const tf15 = closedOnly(pack.tf15);
	const struct = readStructure(tf15);
	const zones = detectZones(tf15);
	const tired = exhaustedMove(tf15, side);
	const funding = nearFunding(pack.now ?? Date.now());
	const atZone = signal.strategy === "ema" || signal.strategy === "vwap" || signal.strategy === "breakout" || inZone(signal.entry, signal.zone, .002);
	const opposing = buy && (bias.trendH4 === "down" || struct.trend === "down") || !buy && (bias.trendH4 === "up" || struct.trend === "up");
	return [
		{
			id: "a1",
			group: "A",
			required: true,
			label: buy ? "Khung lớn đang uptrend hoặc sideway phản ứng từ vùng Bò" : "Khung lớn đang downtrend hoặc sideway phản ứng từ vùng Gấu",
			pass: !opposing,
			note: bias.note
		},
		{
			id: "a2",
			group: "A",
			required: true,
			label: buy ? "Không kiệt sức cuối sóng tăng" : "Không kiệt sức cuối sóng giảm",
			pass: !tired
		},
		{
			id: "a3",
			group: "A",
			required: true,
			label: buy ? "Không có cấu trúc giảm rõ trên khung xương" : "Không có cấu trúc tăng rõ trên khung xương",
			pass: buy ? bias.trendH4 !== "down" : bias.trendH4 !== "up",
			note: `H4/H1: ${bias.trendH4}`
		},
		{
			id: "b1",
			group: "B",
			required: true,
			label: buy ? "Giá đang tại vùng Bò chất lượng" : "Giá đang tại vùng Gấu chất lượng",
			pass: atZone,
			note: signal.zone.label
		},
		{
			id: "b2",
			group: "B",
			required: true,
			label: "Vùng trùng HL/LH hoặc mép hộp / EMA / VWAP",
			pass: Boolean(signal.zone)
		},
		{
			id: "b3",
			group: "B",
			required: true,
			label: "Vùng chưa bị phá vỡ rõ",
			pass: !struct.broken
		},
		{
			id: "b4",
			group: "B",
			required: true,
			label: "Không phải vùng giữa nowhere",
			pass: atZone
		},
		{
			id: "c1",
			group: "C",
			required: true,
			label: buy ? "Lực bán suy yếu khi vào vùng Bò" : "Lực mua suy yếu khi vào vùng Gấu",
			pass: signal.reasons.length > 0
		},
		{
			id: "c2",
			group: "C",
			required: true,
			label: buy ? "Có tín hiệu Bò phản công" : "Có tín hiệu Gấu phản công",
			pass: signal.quality >= 58
		},
		{
			id: "c3",
			group: "C",
			required: true,
			label: "Nếu breakout: đã phá rồi retest, không đuổi nến đầu",
			pass: signal.strategy !== "breakout" || signal.setupName.includes("retest")
		},
		{
			id: "d1",
			group: "D",
			required: true,
			label: "Điểm vào rõ sau nến xác nhận",
			pass: signal.entry > 0
		},
		{
			id: "d2",
			group: "D",
			required: true,
			label: buy ? "SL dưới vùng Bò / HL, có đệm" : "SL trên vùng Gấu / LH, có đệm",
			pass: buy ? signal.sl < signal.entry : signal.sl > signal.entry
		},
		{
			id: "d3",
			group: "D",
			required: true,
			label: "TP1 hướng cấu trúc đối diện",
			pass: buy ? signal.tp1 > signal.entry : signal.tp1 < signal.entry
		},
		{
			id: "d4",
			group: "D",
			required: true,
			label: "R:R tối thiểu 1 : 1.5",
			pass: signal.rr >= 1.5,
			note: `${signal.rr.toFixed(2)}R`
		},
		{
			id: "e1",
			group: "E",
			required: false,
			label: "Hội tụ đa khung / đa setup",
			pass: signal.strategy === "confluence" || zones.length > 0
		},
		{
			id: "e2",
			group: "E",
			required: false,
			label: "Không đang giật tin / funding",
			pass: !funding
		},
		{
			id: "e3",
			group: "E",
			required: false,
			label: "Setup sạch, không gượng ép",
			pass: signal.rejects.length === 0
		},
		{
			id: "f1",
			group: "F",
			required: true,
			label: "Không vào vì FOMO",
			pass: true
		},
		{
			id: "f2",
			group: "F",
			required: true,
			label: "Không vào để gỡ lỗ",
			pass: true
		},
		{
			id: "f3",
			group: "F",
			required: true,
			label: "Đã ghi plan vào nhật ký trước khi bấm lệnh",
			pass: true
		}
	];
}
function requiredOk(items) {
	return items.filter((i) => i.required).every((i) => i.pass);
}
function attachChecklist(signal, pack) {
	const checklist = buildChecklist(signal, pack);
	const ok = requiredOk(checklist) && signal.rejects.length === 0;
	return {
		...signal,
		checklist,
		requiredPass: ok,
		status: ok ? "live" : "watch"
	};
}
function analyze(pack) {
	return scanSetups(pack).map((s) => attachChecklist(s, pack)).sort((a, b) => b.quality - a.quality);
}
function bestLive(signals) {
	return signals.find((s) => s.requiredPass && s.quality >= 70) ?? null;
}
function replay(pack, step = 3) {
	const tf5 = closedOnly(pack.tf5);
	const tf15 = closedOnly(pack.tf15);
	const tfH1 = closedOnly(pack.tfH1);
	const tfH4 = closedOnly(pack.tfH4);
	if (tf5.length < 80 || tf15.length < 40) return [];
	const out = [];
	let cooldownUntil = 0;
	const start = Math.max(60, tf5.length - 180);
	for (let i = start; i < tf5.length - 8; i += step) {
		const bar = tf5[i];
		if (!bar || bar.t < cooldownUntil) continue;
		const slice5 = tf5.slice(0, i + 1);
		const slice15 = tf15.filter((c) => c.t <= bar.t);
		const sliceH1 = tfH1.filter((c) => c.t <= bar.t);
		const sliceH4 = tfH4.filter((c) => c.t <= bar.t);
		const sig = analyze({
			symbol: pack.symbol,
			tf5: slice5,
			tf15: slice15,
			tfH1: sliceH1,
			tfH4: sliceH4,
			now: bar.t + 3e5
		}).filter((s) => s.requiredPass)[0];
		if (!sig) continue;
		const scored = scoreForward(sig, tf5.slice(i + 1, i + 48));
		out.push(scored);
		cooldownUntil = bar.t + 27e5;
		if (out.length >= 12) break;
	}
	return out;
}
function scoreForward(signal, future) {
	const risk = Math.abs(signal.entry - signal.sl);
	let mfeR = 0;
	let maeR = 0;
	let outcome = "open";
	for (const c of future) if (signal.side === "BUY") {
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
	return {
		signal: {
			...signal,
			status: "historical"
		},
		outcome,
		mfeR,
		maeR
	};
}
function replayStats(rows) {
	const done = rows.filter((r) => r.outcome !== "open");
	const wins = done.filter((r) => r.outcome === "tp1" || r.outcome === "tp2");
	const wr = done.length ? wins.length / done.length * 100 : 0;
	const expectancy = done.length === 0 ? 0 : done.reduce((acc, r) => {
		if (r.outcome === "sl") return acc - 1;
		if (r.outcome === "tp2") return acc + 2.5;
		if (r.outcome === "tp1") return acc + 1.5;
		return acc;
	}, 0) / done.length;
	return {
		count: rows.length,
		done: done.length,
		wins: wins.length,
		wr,
		expectancy
	};
}
var useMarket = create((set) => ({
	tickers: [],
	books: {},
	filters: {
		tick: .01,
		step: .001
	},
	signals: [],
	watchHits: [],
	replay: [],
	replaySummary: null,
	lastScanAt: 0,
	loading: true,
	error: null,
	source: "",
	setLoading: (loading) => set({ loading }),
	setError: (error) => set({ error }),
	applyTickers: (tickers) => set({ tickers }),
	applySnapshot: (snap) => {
		const pack = packOf(snap.books, snap.focus);
		const signals = pack ? analyze(pack) : [];
		const watchHits = [];
		for (const [symbol, tfs] of Object.entries(snap.books)) {
			const p = packOf({ [symbol]: tfs }, symbol);
			if (!p) continue;
			const best = analyze(p)[0];
			if (best && best.quality >= 55) watchHits.push({
				symbol,
				quality: best.quality,
				side: best.side,
				setupName: best.setupName,
				requiredPass: best.requiredPass
			});
		}
		const hist = pack ? replay(pack) : [];
		set({
			tickers: snap.tickers,
			books: snap.books,
			filters: snap.filters,
			source: snap.source,
			signals,
			watchHits,
			replay: hist,
			replaySummary: hist.length ? replayStats(hist) : null,
			lastScanAt: snap.at,
			loading: false,
			error: null
		});
	}
}));
function packOf(books, symbol) {
	const tfs = books[symbol];
	if (!tfs?.["5m"]?.length || !tfs["15m"]?.length) return null;
	return {
		symbol,
		tf5: tfs["5m"] ?? [],
		tf15: tfs["15m"] ?? [],
		tfH1: tfs["1h"] ?? [],
		tfH4: tfs["4h"] ?? [],
		now: Date.now()
	};
}
function overlayOf(candles) {
	return {
		ema9: ema(candles.map((x) => x.c), 9),
		ema21: ema(candles.map((x) => x.c), 21),
		vwap: sessionVwap(candles),
		structure: readStructure(candles),
		zones: detectZones(candles)
	};
}
function currentBias(books, symbol) {
	const pack = packOf(books, symbol);
	if (!pack) return null;
	return biasOf(pack);
}
function tickerOf(tickers, symbol) {
	return tickers.find((t) => t.symbol === symbol);
}
//#endregion
export { useMarket as a, tickerOf as i, currentBias as n, overlayOf as r, bestLive as t };
