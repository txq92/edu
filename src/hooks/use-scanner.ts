import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { fetchSeries, fetchSnapshot, fetchTickers } from "@/lib/binance/api";
import { DEFAULT_WATCH } from "@/lib/binance/constants";
import { analyze } from "@/lib/nukida/engine";
import { notifyFill } from "@/hooks/use-signal-alerts";
import { moneySl } from "@/lib/nukida/risk";
import type { Ticker } from "@/lib/nukida/types";
import { usePaper } from "@/lib/store/paper";
import { packOf, useMarket } from "@/lib/store/market";
import { currentRules, useRules } from "@/lib/store/rules";
import { useSettings } from "@/lib/store/settings";

const QUERY = { staleTime: 5_000, refetchOnWindowFocus: false, retry: 1 } as const;

function warm(symbols: string[]) {
  const books = useMarket.getState().books;
  return symbols.every((s) => (books[s]?.["5m"]?.length ?? 0) >= 250);
}

export function useScanner() {
  const symbol = useSettings((s) => s.symbol);
  const chartTf = useSettings((s) => s.chartTf);
  const watch = useSettings((s) => s.watch);
  const symbols = watch.length ? watch : [...DEFAULT_WATCH];
  const symbolsKey = symbols.join(",");
  const autoPaper = useSettings((s) => s.autoPaper);
  const riskPct = useSettings((s) => s.riskPct);
  const equitySetting = useSettings((s) => s.equity);
  const leverageSetting = useSettings((s) => s.maxLeverage);
  const marginSetting = useSettings((s) => s.marginUsd);
  const slUsd = useSettings((s) => s.slUsd);
  const ruleStamp = useRules(
    (s) =>
      `${s.minRr}|${s.minQuality}|${s.fundingFilter}|${s.fundingWindowMin}|${s.requireHtf}|${s.blockExhausted}|${s.autoAllWatch}|${s.sensitivity}`,
  );
  const applySnapshot = useMarket((s) => s.applySnapshot);
  const applyTickers = useMarket((s) => s.applyTickers);
  const setLoading = useMarket((s) => s.setLoading);
  const setError = useMarket((s) => s.setError);
  const lastAuto = useRef<Set<string>>(new Set());

  useEffect(() => {
    const books = useMarket.getState().books[symbol] ?? {};
    const need = [...new Set([chartTf, "1h", "4h"])].filter((iv) => (books[iv]?.length ?? 0) < 120);
    if (!need.length) return;
    let cancel = false;
    void Promise.all(
      need.map((interval) =>
        fetchSeries({ data: { symbol, interval, limit: 288 } }).then((rows) => {
          if (!cancel && rows.length) useMarket.getState().applySeries(symbol, interval, rows);
        }),
      ),
    ).catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [symbol, chartTf]);

  const focus = useQuery({
    queryKey: ["snapshot-focus", symbol],
    queryFn: () =>
      fetchSnapshot({
        data: {
          symbols: [symbol],
          focus: symbol,
          intervals: ["1m", "3m", "5m", "15m", "1h", "4h", "1d"],
          limit: 288,
          tails: warm([symbol]),
        },
      }),
    refetchInterval: 12_000,
    ...QUERY,
  });

  const full = useQuery({
    queryKey: ["snapshot-full", symbolsKey],
    queryFn: () =>
      fetchSnapshot({
        data: {
          symbols,
          focus: symbol,
          intervals: ["3m", "5m", "15m", "1h", "4h"],
          limit: 288,
          tails: warm(symbols),
        },
      }),
    refetchInterval: 25_000,
    ...QUERY,
  });

  const tickers = useQuery({
    queryKey: ["tickers", symbolsKey],
    queryFn: () => fetchTickers({ data: { symbols } }),
    refetchInterval: 20_000,
    ...QUERY,
  });

  useEffect(() => {
    const streams = symbolsKey
      .split(",")
      .filter(Boolean)
      .map((s) => `${s.toLowerCase()}@miniTicker`)
      .join("/");
    if (!streams) return;
    let ws: WebSocket | null = null;
    let dead = false;
    let retry = 0;
    let raf = 0;
    const buf = new Map<string, Ticker>();

    const flush = () => {
      raf = 0;
      if (!buf.size) return;
      const rows = [...buf.values()];
      buf.clear();
      applyTickers(rows);
      const all = useMarket.getState().tickers;
      if (all.length) usePaper.getState().tick(all);
    };

    const connect = () => {
      if (dead) return;
      ws = new WebSocket(`wss://data-stream.binance.vision/stream?streams=${streams}`);
      ws.onmessage = (ev) => {
        const msg = JSON.parse(String(ev.data)) as { data?: { s?: string; c?: string; o?: string; h?: string; l?: string; v?: string } };
        const d = msg.data;
        if (!d?.s || !d.c) return;
        const price = Number(d.c);
        const open = Number(d.o);
        if (!Number.isFinite(price) || price <= 0) return;
        buf.set(d.s, {
          symbol: d.s,
          price,
          changePct: open ? ((price - open) / open) * 100 : 0,
          high: Number(d.h) || price,
          low: Number(d.l) || price,
          volume: Number(d.v) || 0,
        });
        if (!raf) raf = requestAnimationFrame(flush);
      };
      ws.onclose = () => {
        if (!dead) retry = window.setTimeout(connect, 2000);
      };
    };
    connect();
    return () => {
      dead = true;
      window.clearTimeout(retry);
      if (raf) cancelAnimationFrame(raf);
      ws?.close();
    };
  }, [symbolsKey, applyTickers]);

  useEffect(() => {
    setLoading(focus.isFetching && !focus.data && !full.data);
  }, [focus.isFetching, focus.data, full.data, setLoading]);

  useEffect(() => {
    if (!focus.data) {
      if (focus.error && !full.data) {
        setError(focus.error instanceof Error ? focus.error.message : "Không tải được thị trường");
      }
      return;
    }
    applySnapshot({ ...focus.data, focus: symbol });
    setError(null);
  }, [focus.data, focus.error, full.data, symbol, applySnapshot, setError]);

  useEffect(() => {
    if (!full.data) return;
    applySnapshot({ ...full.data, focus: symbol });
    setError(null);
  }, [full.data, symbol, applySnapshot, setError]);

  useEffect(() => {
    if (tickers.data) applyTickers(tickers.data);
  }, [tickers.data, applyTickers]);

  useEffect(() => {
    const t = useMarket.getState().tickers;
    if (t.length) usePaper.getState().tick(t);
  }, [tickers.data]);

  useEffect(() => {
    useMarket.getState().rescan(symbol);
  }, [ruleStamp, symbol]);

  useEffect(() => {
    if (!autoPaper || !(full.data ?? focus.data)) return;
    const rules = currentRules();
    const state = useMarket.getState();
    const paper = usePaper.getState();
    if (Date.now() < paper.haltUntil) return;
    const settings = useSettings.getState();
    const setups = state.watchHits.filter((h) => h.requiredPass);
    for (const hit of setups) {
      const pack = packOf(state.books, hit.symbol);
      if (!pack) continue;
      const live = analyze(pack, rules).find((s) => s.requiredPass);
      if (!live || lastAuto.current.has(live.id)) continue;
      const planned = moneySl(live, {
        marginUsd: settings.marginUsd,
        leverage: settings.maxLeverage,
        slUsd: settings.slUsd,
        minRr: rules.minRr,
        step: state.filters.step,
      });
      const pos = paper.placeFromSignal(planned, {
        equity: settings.equity,
        riskPct: settings.riskPct,
        step: state.filters.step,
        leverage: settings.maxLeverage,
        marginUsd: settings.marginUsd,
        sizeBy: "margin",
        mode: "paper",
      });
      if (!pos) continue;
      lastAuto.current.add(live.id);
      toast.success(`${live.symbol.replace("USDT", "")} · ${live.side === "BUY" ? "LONG" : "SHORT"} · ${live.setupName}`);
      notifyFill(pos, "auto");
    }
  }, [autoPaper, full.data, focus.data, riskPct, equitySetting, leverageSetting, marginSetting, slUsd, symbol, ruleStamp]);
}
