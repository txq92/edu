//#region node_modules/.nitro/vite/services/ssr/assets/market.server-iZkChh-y.js
var VISION = "https://data-api.binance.vision";
var BINANCE_US = "https://api.binance.us";
var OKX = "https://www.okx.com";
var OKX_BAR = {
	"5m": "5m",
	"15m": "15m",
	"1h": "1H",
	"4h": "4H"
};
function okxInst(symbol) {
	return symbol.replace("USDT", "-USDT-SWAP");
}
function parseBinanceKlines(rows) {
	const now = Date.now();
	return rows.map((row) => {
		const t = Number(row[0]);
		const closeTime = Number(row[6]);
		return {
			t,
			o: Number(row[1]),
			h: Number(row[2]),
			l: Number(row[3]),
			c: Number(row[4]),
			v: Number(row[5]),
			closed: now >= closeTime
		};
	});
}
async function fetchJson(url, timeoutMs = 8e3) {
	const ctrl = new AbortController();
	const t = setTimeout(() => ctrl.abort(), timeoutMs);
	try {
		const res = await fetch(url, {
			signal: ctrl.signal,
			headers: { Accept: "application/json" }
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		return await res.json();
	} finally {
		clearTimeout(t);
	}
}
async function getKlines(symbol, interval, limit = 200) {
	const urls = [`${VISION}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`, `${BINANCE_US}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`];
	for (const url of urls) try {
		const json = await fetchJson(url);
		if (Array.isArray(json) && json[0] && Array.isArray(json[0])) return parseBinanceKlines(json);
	} catch {}
	try {
		const bar = OKX_BAR[interval] ?? "15m";
		const rows = ((await fetchJson(`${OKX}/api/v5/market/candles?instId=${okxInst(symbol)}&bar=${bar}&limit=${Math.min(limit, 100)}`)).data ?? []).slice().reverse();
		const now = Date.now();
		const ms = interval === "4h" ? 144e5 : interval === "1h" ? 36e5 : interval === "15m" ? 9e5 : 3e5;
		return rows.map((row) => {
			const t = Number(row[0]);
			return {
				t,
				o: Number(row[1]),
				h: Number(row[2]),
				l: Number(row[3]),
				c: Number(row[4]),
				v: Number(row[5]),
				closed: now >= t + ms
			};
		});
	} catch {
		return [];
	}
}
async function getTickers(symbols) {
	const out = [];
	await Promise.all(symbols.map(async (symbol) => {
		try {
			const json = await fetchJson(`${VISION}/api/v3/ticker/24hr?symbol=${symbol}`);
			if (json.lastPrice) {
				out.push({
					symbol,
					price: Number(json.lastPrice),
					changePct: Number(json.priceChangePercent),
					high: Number(json.highPrice),
					low: Number(json.lowPrice),
					volume: Number(json.volume)
				});
				return;
			}
		} catch {}
		try {
			const json = await fetchJson(`${VISION}/api/v3/ticker/price?symbol=${symbol}`);
			if (json.price) out.push({
				symbol,
				price: Number(json.price),
				changePct: 0,
				high: 0,
				low: 0,
				volume: 0
			});
		} catch {}
	}));
	return out;
}
var filterCache = /* @__PURE__ */ new Map();
async function getFilters(symbol) {
	const cached = filterCache.get(symbol);
	if (cached) return cached;
	try {
		const filters = (await fetchJson(`${VISION}/api/v3/exchangeInfo?symbol=${symbol}`)).symbols?.[0]?.filters ?? [];
		const price = filters.find((f) => f.filterType === "PRICE_FILTER");
		const lot = filters.find((f) => f.filterType === "LOT_SIZE");
		const info = {
			tick: Number(price?.tickSize ?? .01),
			step: Number(lot?.stepSize ?? .001)
		};
		filterCache.set(symbol, info);
		return info;
	} catch {
		return {
			tick: .01,
			step: .001
		};
	}
}
async function getSnapshot(opts) {
	const limit = opts.limit ?? 200;
	const [tickers, focusBooks, watchBooks, filters] = await Promise.all([
		getTickers(opts.symbols),
		Promise.all(opts.intervals.map((iv) => getKlines(opts.focus, iv, limit).then((c) => [iv, c]))),
		Promise.all(opts.symbols.filter((s) => s !== opts.focus).map(async (s) => {
			const [tf5, tf15] = await Promise.all([getKlines(s, "5m", 120), getKlines(s, "15m", 120)]);
			return [s, {
				"5m": tf5,
				"15m": tf15
			}];
		})),
		getFilters(opts.focus)
	]);
	const books = { [opts.focus]: Object.fromEntries(focusBooks) };
	for (const [sym, data] of watchBooks) books[sym] = data;
	return {
		tickers,
		books,
		filters,
		source: "binance-vision",
		at: Date.now()
	};
}
//#endregion
export { getSnapshot, getTickers };
