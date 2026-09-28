import { create } from "zustand";
import type { Candle, ReplayResult, Signal, Ticker } from "@/lib/nukida/types";
import { biasOf, higherTrend, zoneHit, type MarketPack } from "@/lib/nukida/strategies";
import { closedOnly, ema, sessionVwap } from "@/lib/nukida/indicators";
import { analyze, replay, replayStats } from "@/lib/nukida/engine";
import { currentRules } from "@/lib/store/rules";
import { readStructure } from "@/lib/nukida/structure";

export type ScanPhase = "nen" | "trong" | "cho" | "ngoai";

export type WatchHit = {
  symbol: string;
  quality: number;
  side: Signal["side"];
  setupName: string;
  requiredPass: boolean;
  phase: ScanPhase;
  trend: "up" | "down" | "side";
  entry: number;
  sl: number;
  rr: number;
  at: number;
};

type MarketState = {
  tickers: Ticker[];
  books: Record<string, Record<string, Candle[]>>;
  filters: { tick: number; step: number };
  signals: Signal[];
  watchHits: WatchHit[];
  replay: ReplayResult[];
  replaySummary: ReturnType<typeof replayStats> | null;
  lastScanAt: number;
  loading: boolean;
  error: string | null;
  source: string;
  applySnapshot: (snap: {
    tickers: Ticker[];
    books: Record<string, Record<string, Candle[]>>;
    filters: { tick: number; step: number };
    source: string;
    at: number;
    focus: string;
  }) => void;
  applyTickers: (tickers: Ticker[]) => void;
  applySeries: (symbol: string, interval: string, rows: Candle[]) => void;
  rescan: (focus: string) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
};

function scoreBooks(books: Record<string, Record<string, Candle[]>>, focus: string) {
  const rules = currentRules();
  const pack = packOf(books, focus);
  const signals = pack ? analyze(pack, rules) : [];
  const watchHits: WatchHit[] = [];
  for (const [symbol, tfs] of Object.entries(books)) {
    const p = packOf({ [symbol]: tfs }, symbol);
    if (!p) continue;
    const best = analyze(p, rules)[0];
    const trend = higherTrend(p);
    const last = closedOnly(p.tf5).at(-1);
    const price = last?.c ?? 0;
    const side = best?.side ?? (trend === "down" ? "SELL" : "BUY");
    const inZone = price > 0 && Boolean(zoneHit(p, side, price, rules.sensitivity));
    const phase: ScanPhase = best?.requiredPass ? "nen" : inZone ? "trong" : trend === "side" ? "ngoai" : "cho";
    watchHits.push({
      symbol,
      quality: best?.quality ?? 0,
      side,
      setupName: best?.setupName ?? "",
      requiredPass: Boolean(best?.requiredPass),
      phase,
      trend,
      entry: best?.entry ?? 0,
      sl: best?.sl ?? 0,
      rr: best?.rr ?? 0,
      at: best?.barTime ?? last?.t ?? 0,
    });
  }
  return { signals, watchHits };
}

export const useMarket = create<MarketState>((set, get) => ({
  tickers: [],
  books: {},
  filters: { tick: 0.01, step: 0.001 },
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
  applyTickers: (tickers) => set((s) => ({ tickers: mergeTickers(s.tickers, tickers) })),
  applySeries: (symbol, interval, rows) => {
    if (!rows.length) return;
    const prev = get();
    const tfs = prev.books[symbol] ?? {};
    const books = {
      ...prev.books,
      [symbol]: { ...tfs, [interval]: mergeSeries(tfs[interval], rows) },
    };
    const scored = scoreBooks(books, symbol);
    set({ books, signals: scored.signals, watchHits: scored.watchHits });
  },
  applySnapshot: (snap) => {
    const prev = get();
    const books = { ...prev.books };
    for (const [sym, tfs] of Object.entries(snap.books)) {
      const prevTfs = books[sym] ?? {};
      const nextTfs: Record<string, Candle[]> = { ...prevTfs };
      for (const [iv, rows] of Object.entries(tfs)) {
        nextTfs[iv] = mergeSeries(prevTfs[iv], rows);
      }
      books[sym] = nextTfs;
    }
    const tickers = mergeTickers(prev.tickers, snap.tickers);
    const scored = scoreBooks(books, snap.focus);
    set({
      tickers,
      books,
      filters: snap.filters.tick ? snap.filters : prev.filters,
      source: snap.source,
      signals: scored.signals,
      watchHits: scored.watchHits,
      lastScanAt: snap.at,
      loading: false,
      error: null,
    });
    queueReplay(snap.focus);
  },
  rescan: (focus) => {
    const scored = scoreBooks(get().books, focus);
    set({ signals: scored.signals, watchHits: scored.watchHits });
    queueReplay(focus);
  },
}));

function mergeSeries(prev: Candle[] | undefined, next: Candle[]): Candle[] {
  if (!prev?.length || next.length >= prev.length) return next;
  const map = new Map<number, Candle>();
  for (const c of prev) map.set(c.t, c);
  for (const c of next) map.set(c.t, c);
  return [...map.values()].sort((a, b) => a.t - b.t).slice(-288);
}

export function packOf(books: Record<string, Record<string, Candle[]>>, symbol: string): MarketPack | null {
  const tfs = books[symbol];
  if (!tfs?.["5m"]?.length || !tfs["15m"]?.length) return null;
  return {
    symbol,
    tf5: tfs["5m"] ?? [],
    tf15: tfs["15m"] ?? [],
    tfH1: tfs["1h"] ?? [],
    tfH4: tfs["4h"] ?? [],
    now: Date.now(),
  };
}

export function overlayOf(candles: Candle[]) {
  const e9 = ema(
    candles.map((x) => x.c),
    9,
  );
  const e21 = ema(
    candles.map((x) => x.c),
    21,
  );
  const vw = sessionVwap(candles);
  return { ema9: e9, ema21: e21, vwap: vw, structure: readStructure(candles) };
}

export function currentBias(books: Record<string, Record<string, Candle[]>>, symbol: string) {
  const pack = packOf(books, symbol);
  if (!pack) return null;
  return biasOf(pack);
}

export function tickerOf(tickers: Ticker[], symbol: string): Ticker | undefined {
  return tickers.find((t) => t.symbol === symbol);
}

function mergeTickers(prev: Ticker[], next: Ticker[]): Ticker[] {
  if (!next.length) return prev;
  const map = new Map(prev.map((t) => [t.symbol, t]));
  for (const t of next) {
    if (!Number.isFinite(t.price) || t.price <= 0) continue;
    map.set(t.symbol, t);
  }
  return [...map.values()];
}

let replayTimer = 0;
let replayKey = "";

function queueReplay(focus: string) {
  if (typeof window === "undefined") return;
  window.clearTimeout(replayTimer);
  replayTimer = window.setTimeout(() => {
    const pack = packOf(useMarket.getState().books, focus);
    if (!pack?.tf5.length) return;
    const rules = currentRules();
    const last = pack.tf5[pack.tf5.length - 1]?.t ?? 0;
    const key = `${focus}:${last}:${pack.tf5.length}:${rules.minRr}:${rules.minQuality}:${rules.sensitivity}:${rules.requireHtf}:${rules.blockExhausted}:${rules.fundingFilter}:${rules.autoAllWatch}`;
    if (key === replayKey) return;
    replayKey = key;
    const hist = replay(pack, 3, rules);
    useMarket.setState({
      replay: hist,
      replaySummary: hist.length ? replayStats(hist) : null,
    });
  }, 300);
}
