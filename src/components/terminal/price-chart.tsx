import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  TickMarkType,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle, Signal, Zone } from "@/lib/nukida/types";
import { VN_TZ } from "@/lib/nukida/format";
import { overlayOf } from "@/lib/store/market";

const BULL = "#3d9a6a";
const BEAR = "#c45c5c";
const EMA9 = "#d8d4cc";
const EMA21 = "#8a8c90";
const VWAP = "#b8956a";

type Bar = { time: UTCTimestamp; open: number; high: number; low: number; close: number };
type Point = { time: UTCTimestamp; value: number };

function barsOf(candles: Candle[]): Bar[] {
  return candles.map((c) => ({
    time: Math.floor(c.t / 1000) as UTCTimestamp,
    open: c.o,
    high: c.h,
    low: c.l,
    close: c.c,
  }));
}

function pointsOf(candles: Candle[], values: Array<number | null>): Point[] {
  const out: Point[] = [];
  candles.forEach((c, i) => {
    const v = values[i];
    if (v == null) return;
    out.push({ time: Math.floor(c.t / 1000) as UTCTimestamp, value: v });
  });
  return out;
}

function chartZones(zones: Zone[]): Zone[] {
  const out: Zone[] = [];
  for (const tf of ["H4", "H1"]) {
    for (const kind of ["bull", "bear"] as const) {
      const hit = zones.find((z) => z.kind === kind && z.label.startsWith(`${tf} `));
      if (hit) out.push(hit);
    }
  }
  return out;
}

function vnParts(time: Time) {
  if (typeof time !== "number") return null;
  const d = new Date(time * 1000);
  const hm = d.toLocaleTimeString("vi-VN", {
    timeZone: VN_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const day = d.toLocaleDateString("vi-VN", { timeZone: VN_TZ, day: "2-digit", month: "2-digit" });
  return { hm, day };
}

export function PriceChart({
  candles,
  signal,
  entry,
  sl,
  tp1,
  tp2,
  resetKey,
  zones,
}: {
  candles: Candle[];
  signal: Signal | null;
  entry?: number;
  sl?: number;
  tp1?: number;
  tp2?: number;
  resetKey: string;
  zones: Zone[];
}) {
  const host = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const ema9Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ema21Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const vwapRef = useRef<ISeriesApi<"Line"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const marksRef = useRef<IPriceLine[]>([]);
  const fittedKey = useRef("");

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const chart = createChart(node, {
      width: node.clientWidth,
      height: node.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "#151619" },
        textColor: "#8a8c90",
        fontFamily: "IBM Plex Sans, sans-serif",
      },
      grid: {
        vertLines: { color: "#2a2c30" },
        horzLines: { color: "#2a2c30" },
      },
      rightPriceScale: { borderColor: "#2a2c30" },
      timeScale: {
        borderColor: "#2a2c30",
        timeVisible: true,
        secondsVisible: false,
        shiftVisibleRangeOnNewBar: false,
        tickMarkFormatter: (time: Time, type: TickMarkType) => {
          const p = vnParts(time);
          if (!p) return "";
          return type === TickMarkType.Time || type === TickMarkType.TimeWithSeconds ? p.hm : p.day;
        },
      },
      localization: {
        locale: "vi-VN",
        timeFormatter: (time: Time) => {
          const p = vnParts(time);
          return p ? `${p.hm} ${p.day}` : "";
        },
      },
      crosshair: { vertLine: { color: "#5c5e62" }, horzLine: { color: "#5c5e62" } },
    });
    chartRef.current = chart;
    candleRef.current = chart.addSeries(CandlestickSeries, {
      upColor: BULL,
      downColor: BEAR,
      borderUpColor: BULL,
      borderDownColor: BEAR,
      wickUpColor: BULL,
      wickDownColor: BEAR,
    });
    const lineOpts = {
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    };
    ema9Ref.current = chart.addSeries(LineSeries, { ...lineOpts, color: EMA9, lineWidth: 1 });
    ema21Ref.current = chart.addSeries(LineSeries, { ...lineOpts, color: EMA21, lineWidth: 2 });
    vwapRef.current = chart.addSeries(LineSeries, { ...lineOpts, color: VWAP, lineWidth: 1 });
    volumeRef.current = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    candleRef.current.priceScale().applyOptions({
      scaleMargins: { top: 0.08, bottom: 0.28 },
    });
    volumeRef.current.priceScale().applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 },
    });

    const ro = new ResizeObserver(() => {
      if (!host.current) return;
      chart.applyOptions({ width: host.current.clientWidth, height: host.current.clientHeight });
    });
    ro.observe(node);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      fittedKey.current = "";
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const series = candleRef.current;
    if (!chart || !series || candles.length < 2) return;

    const timeScale = chart.timeScale();
    const priceScale = chart.priceScale("right");
    const keepZoom = fittedKey.current === resetKey;
    const logical = keepZoom ? timeScale.getVisibleLogicalRange() : null;
    const priceRange = keepZoom ? priceScale.getVisibleRange() : null;
    const last = candles[candles.length - 1];
    if (last) {
      const abs = Math.abs(last.c);
      const precision = abs >= 1000 ? 2 : abs >= 100 ? 3 : abs >= 1 ? 4 : abs >= 0.01 ? 6 : 8;
      series.applyOptions({
        priceFormat: { type: "price", precision, minMove: 10 ** -precision },
      });
    }

    series.setData(barsOf(candles));
    volumeRef.current?.setData(
      candles.map((c) => ({
        time: Math.floor(c.t / 1000) as UTCTimestamp,
        value: c.v,
        color: c.c >= c.o ? "rgba(61, 154, 106, 0.55)" : "rgba(196, 92, 92, 0.5)",
      })),
    );
    const overlay = overlayOf(candles);
    ema9Ref.current?.setData(pointsOf(candles, overlay.ema9));
    ema21Ref.current?.setData(pointsOf(candles, overlay.ema21));
    vwapRef.current?.setData(pointsOf(candles, overlay.vwap));

    for (const line of marksRef.current) series.removePriceLine(line);
    marksRef.current = [];

    const mark = (price: number, color: string, title: string, style: LineStyle) => {
      marksRef.current.push(
        series.createPriceLine({
          price,
          color,
          lineWidth: 1,
          lineStyle: style,
          title,
          axisLabelVisible: true,
        }),
      );
    };

    chartZones(zones).forEach((z) => {
      mark(z.kind === "bull" ? z.lo : z.hi, z.kind === "bull" ? BULL : BEAR, z.label, LineStyle.Dashed);
    });

    const hasTrade = entry != null && sl != null && tp1 != null && tp2 != null;
    const plan = hasTrade
      ? { entry, sl, tp1, tp2 }
      : signal
        ? { entry: signal.entry, sl: signal.sl, tp1: signal.tp1, tp2: signal.tp2 }
        : null;
    if (plan) {
      mark(plan.entry, EMA9, "Vào", LineStyle.Solid);
      mark(plan.sl, BEAR, "SL", LineStyle.SparseDotted);
      mark(plan.tp1, BULL, "TP1", LineStyle.Dashed);
      mark(plan.tp2, BULL, "TP2", LineStyle.Solid);
    }

    if (!keepZoom) {
      priceScale.setAutoScale(true);
      timeScale.fitContent();
      fittedKey.current = resetKey;
      return;
    }
    if (logical) timeScale.setVisibleLogicalRange(logical);
    if (priceRange && priceRange.from !== priceRange.to) {
      priceScale.setAutoScale(false);
      priceScale.setVisibleRange(priceRange);
    }
  }, [candles, signal, entry, sl, tp1, tp2, resetKey, zones]);

  return <div ref={host} className="h-full w-full" />;
}
