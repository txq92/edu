import type { Candle, Ticker } from "@/lib/nukida/types";

const VISION = "https://data-api.binance.vision";
const BINANCE_US = "https://api.binance.us";
const OKX = "https://www.okx.com";

const OKX_BAR: Record<string, string> = {
  "3m": "3m",
  "5m": "5m",
  "15m": "15m",
  "1h": "1H",
  "4h": "4H",
};

const BAR_MS: Record<string, number> = {
  "3m": 3 * 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "1h": 3600_000,
  "4h": 4 * 3600_000,
};

const FRESH_MS: Record<string, number> = {
  "3m": 4_000,
  "5m": 6_000,
  "15m": 12_000,
  "1h": 40_000,
  "4h": 90_000,
};

const HOSTS = [VISION, BINANCE_US];
let preferredHost = VISION;

type KlineCache = { candles: Candle[]; at: number };
const klineCache = new Map<string, KlineCache>();
const inflight = new Map<string, Promise<Candle[]>>();

function okxInst(symbol: string): string {
  return symbol.replace("USDT", "-USDT-SWAP");
}

function parseBinanceKlines(rows: Array<Array<string | number>>): Candle[] {
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
      closed: now >= closeTime,
    };
  });
}

function mergeCandles(prev: Candle[], next: Candle[], cap: number): Candle[] {
  const map = new Map<number, Candle>();
  for (const c of prev) map.set(c.t, c);
  for (const c of next) map.set(c.t, c);
  return [...map.values()].sort((a, b) => a.t - b.t).slice(-cap);
}

async function fetchJson(url: string, timeoutMs = 4500): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function fetchBinanceKlines(symbol: string, interval: string, limit: number): Promise<Candle[]> {
  const order = [preferredHost, ...HOSTS.filter((h) => h !== preferredHost)];
  for (const host of order) {
    try {
      const json = await fetchJson(
        `${host}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
        host === preferredHost ? 4500 : 3000,
      );
      if (Array.isArray(json) && json[0] && Array.isArray(json[0])) {
        preferredHost = host;
        return parseBinanceKlines(json as Array<Array<string | number>>);
      }
    } catch {
      /* next host */
    }
  }
  return [];
}

async function fetchOkxKlines(symbol: string, interval: string, limit: number): Promise<Candle[]> {
  const bar = OKX_BAR[interval] ?? "15m";
  const json = (await fetchJson(
    `${OKX}/api/v5/market/candles?instId=${okxInst(symbol)}&bar=${bar}&limit=${Math.min(limit, 100)}`,
    4000,
  )) as { data?: string[][] };
  const rows = (json.data ?? []).slice().reverse();
  const now = Date.now();
  const ms = BAR_MS[interval] ?? 5 * 60_000;
  return rows.map((row) => {
    const t = Number(row[0]);
    return {
      t,
      o: Number(row[1]),
      h: Number(row[2]),
      l: Number(row[3]),
      c: Number(row[4]),
      v: Number(row[5]),
      closed: now >= t + ms,
    };
  });
}

async function loadKlines(symbol: string, interval: string, limit: number, hit: KlineCache | undefined): Promise<Candle[]> {
  const cap = Math.max(limit, hit?.candles.length ?? 0, 120);
  const incremental = Boolean(hit && hit.candles.length + 2 >= limit);
  let candles: Candle[] = [];
  if (incremental && hit) {
    const tail = await fetchBinanceKlines(symbol, interval, 3);
    candles = tail.length ? mergeCandles(hit.candles, tail, cap) : hit.candles;
  } else {
    candles = await fetchBinanceKlines(symbol, interval, limit);
    if (!candles.length) {
      try {
        candles = await fetchOkxKlines(symbol, interval, limit);
      } catch {
        candles = [];
      }
    }
  }
  if (!candles.length && hit) return hit.candles;
  if (candles.length) klineCache.set(`${symbol}|${interval}`, { candles, at: Date.now() });
  return candles;
}

export async function getKlines(symbol: string, interval: string, limit = 200): Promise<Candle[]> {
  const key = `${symbol}|${interval}`;
  const hit = klineCache.get(key);
  const freshFor = FRESH_MS[interval] ?? 12_000;
  if (hit && Date.now() - hit.at < freshFor && hit.candles.length >= limit) {
    return hit.candles.slice(-limit);
  }
  const pending = inflight.get(key);
  if (pending) return (await pending).slice(-limit);

  const job = loadKlines(symbol, interval, limit, hit);
  inflight.set(key, job);
  try {
    return (await job).slice(-limit);
  } finally {
    inflight.delete(key);
  }
}

function toTicker(row: {
  symbol?: string;
  lastPrice?: string;
  priceChangePercent?: string;
  highPrice?: string;
  lowPrice?: string;
  volume?: string;
}): Ticker | null {
  if (!row.symbol || !row.lastPrice) return null;
  return {
    symbol: row.symbol,
    price: Number(row.lastPrice),
    changePct: Number(row.priceChangePercent ?? 0),
    high: Number(row.highPrice ?? 0),
    low: Number(row.lowPrice ?? 0),
    volume: Number(row.volume ?? 0),
  };
}

export async function getTickers(symbols: string[]): Promise<Ticker[]> {
  const uniq = [...new Set(symbols)];
  if (!uniq.length) return [];
  try {
    const q = encodeURIComponent(JSON.stringify(uniq));
    const json = await fetchJson(`${preferredHost}/api/v3/ticker/24hr?symbols=${q}`, 4500);
    if (Array.isArray(json)) {
      const rows = json.map((row) => toTicker(row as Parameters<typeof toTicker>[0])).filter((t): t is Ticker => Boolean(t));
      if (rows.length) return rows;
    }
  } catch {
    /* fall through */
  }
  const out: Ticker[] = [];
  await mapPool(uniq, 6, async (symbol) => {
    try {
      const json = (await fetchJson(`${VISION}/api/v3/ticker/price?symbol=${symbol}`, 3000)) as { price?: string };
      if (json.price) {
        out.push({ symbol, price: Number(json.price), changePct: 0, high: 0, low: 0, volume: 0 });
      }
    } catch {
      /* skip */
    }
  });
  return out;
}

const filterCache = new Map<string, { tick: number; step: number }>();

export async function getFilters(symbol: string): Promise<{ tick: number; step: number }> {
  const cached = filterCache.get(symbol);
  if (cached) return cached;
  try {
    const json = (await fetchJson(`${preferredHost}/api/v3/exchangeInfo?symbol=${symbol}`)) as {
      symbols?: Array<{
        filters?: Array<{ filterType: string; tickSize?: string; stepSize?: string }>;
      }>;
    };
    const filters = json.symbols?.[0]?.filters ?? [];
    const price = filters.find((f) => f.filterType === "PRICE_FILTER");
    const lot = filters.find((f) => f.filterType === "LOT_SIZE");
    const info = {
      tick: Number(price?.tickSize ?? 0.01),
      step: Number(lot?.stepSize ?? 0.001),
    };
    filterCache.set(symbol, info);
    return info;
  } catch {
    return { tick: 0.01, step: 0.001 };
  }
}

async function mapPool<T>(items: T[], size: number, fn: (item: T) => Promise<void>): Promise<void> {
  if (!items.length) return;
  let cursor = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;
      if (item !== undefined) await fn(item);
    }
  });
  await Promise.all(workers);
}

export async function getSnapshot(opts: {
  symbols: string[];
  focus: string;
  intervals: string[];
  limit?: number;
}) {
  const limit = opts.limit ?? 120;
  const watchLimit = Math.min(limit, 90);
  const others = opts.symbols.filter((s) => s !== opts.focus);
  const watchBooks: Array<readonly [string, Record<string, Candle[]>]> = [];

  const [tickers, focusBooks, , filters] = await Promise.all([
    getTickers(opts.symbols),
    Promise.all(opts.intervals.map((iv) => getKlines(opts.focus, iv, limit).then((c) => [iv, c] as const))),
    mapPool(others, 8, async (s) => {
      const [tf5, tf15] = await Promise.all([getKlines(s, "5m", watchLimit), getKlines(s, "15m", watchLimit)]);
      watchBooks.push([s, { "5m": tf5, "15m": tf15 }] as const);
    }),
    getFilters(opts.focus),
  ]);

  const books: Record<string, Record<string, Candle[]>> = {
    [opts.focus]: Object.fromEntries(focusBooks),
  };
  for (const [sym, data] of watchBooks) books[sym] = data;

  return { tickers, books, filters, source: "binance-vision" as const, at: Date.now() };
}
