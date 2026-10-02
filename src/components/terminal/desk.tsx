import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CHART_INTERVALS, INTERVAL_LABEL } from "@/lib/binance/constants";
import { moneySl } from "@/lib/nukida/risk";
import { useRules } from "@/lib/store/rules";
import { formatPct, formatPrice, formatUsd } from "@/lib/nukida/format";
import { currentBias, packOf, tickerOf, useMarket } from "@/lib/store/market";
import { frameZones } from "@/lib/nukida/strategies";
import { paperEquity, usePaper } from "@/lib/store/paper";
import { useSettings } from "@/lib/store/settings";
import { PositionsBar } from "./positions-bar";
import { PriceChart } from "./price-chart";
import { SignalPanel } from "./signal-panel";
import { Watchlist } from "./watchlist";
import { cn } from "@/lib/utils";
import { useEffect, useMemo } from "react";

export function Desk() {
  const symbol = useSettings((s) => s.symbol);
  const chartTf = useSettings((s) => s.chartTf);
  const setChartTf = useSettings((s) => s.setChartTf);
  const autoPaper = useSettings((s) => s.autoPaper);
  const liveArmed = useSettings((s) => s.liveArmed);
  const patch = useSettings((s) => s.patch);
  const books = useMarket((s) => s.books);
  const tickers = useMarket((s) => s.tickers);
  const signals = useMarket((s) => s.signals);
  const error = useMarket((s) => s.error);
  const replaySummary = useMarket((s) => s.replaySummary);
  const cash = usePaper((s) => s.cash);
  const positions = usePaper((s) => s.positions);
  const startEquity = usePaper((s) => s.startEquity);
  const close = usePaper((s) => s.close);
  const filters = useMarket((s) => s.filters);
  const minRr = useRules((s) => s.minRr);
  const marginUsd = useSettings((s) => s.marginUsd);
  const leverage = useSettings((s) => s.maxLeverage);
  const slUsd = useSettings((s) => s.slUsd);
  const ticker = tickerOf(tickers, symbol);
  const candles = books[symbol]?.[chartTf] ?? [];
  const htfZones = useMemo(() => {
    const pack = packOf(books, symbol);
    return pack ? frameZones(pack) : [];
  }, [books, symbol]);
  const bias = currentBias(books, symbol);
  const live = signals.find((s) => s.requiredPass) ?? null;
  const shown = live
    ? moneySl(live, { marginUsd, leverage, slUsd, minRr, step: filters.step })
    : null;
  const open = positions.find((p) => p.symbol === symbol);
  const equity = paperEquity(cash, positions, tickers);
  const daily = equity - startEquity;
  const up = (ticker?.changePct ?? 0) >= 0;

  useEffect(() => {
    if (sessionStorage.getItem("meo-den-scroll-chart") !== "1") return;
    sessionStorage.removeItem("meo-den-scroll-chart");
    document.getElementById("desk-chart")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="font-display text-3xl">{symbol.replace("USDT", "")}</h1>
              <span className="font-mono text-2xl tabular-nums">{ticker ? formatPrice(ticker.price) : "—"}</span>
              {ticker ? (
                <span className={cn("font-mono text-sm tabular-nums", up ? "text-bull" : "text-bear")}>
                  {formatPct(ticker.changePct)}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted">{bias?.note ?? "Đang đọc cấu trúc…"}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-4 sm:flex-col sm:items-end">
            <Badge tone={liveArmed ? "bear" : "neutral"}>{liveArmed ? "LIVE" : "PAPER"}</Badge>
            <div className="sm:text-right">
              <div className="text-xs text-faint">Tài khoản giấy</div>
              <div className="font-mono tabular-nums">{formatUsd(equity)}</div>
              <div className={cn("font-mono text-xs tabular-nums", daily >= 0 ? "text-bull" : "text-bear")}>
                {formatUsd(daily)} hôm nay
              </div>
            </div>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <Switch checked={autoPaper} onCheckedChange={(v) => patch({ autoPaper: v })} />
              Auto paper
            </label>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-line bg-raised px-4 py-3 text-sm text-warn">{error}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)_20rem]">
        <aside className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]">
          <p className="mb-2 px-1 text-xs tracking-wide text-muted uppercase">Rổ quét</p>
          <Watchlist />
          {replaySummary ? (
            <div className="mt-4 rounded-md bg-raised p-3 text-xs text-muted">
              <p className="mb-1 text-fg">Replay rule</p>
              <p>
                {replaySummary.done} lệnh · thắng {replaySummary.wins} · WR {replaySummary.wr.toFixed(0)}%
              </p>
              <p>Kỳ vọng {replaySummary.expectancy.toFixed(2)}R / lệnh</p>
            </div>
          ) : null}
        </aside>

        <section id="desk-chart" className="scroll-mt-20 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="max-w-full overflow-x-auto">
              <Tabs value={chartTf} onValueChange={(v) => setChartTf(v as typeof chartTf)}>
                <TabsList>
                  {CHART_INTERVALS.map((tf) => (
                    <TabsTrigger key={tf} value={tf}>
                      {INTERVAL_LABEL[tf]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="text-fg">EMA9</span>
              <span>EMA21</span>
              <span className="text-warn">VWAP</span>
              <span>Vol</span>
              {open ? (
                <span className="text-fg">
                  Vào · <span className="text-bear">SL</span> · <span className="text-bull">TP1 TP2</span>
                </span>
              ) : null}
            </div>
          </div>
          <div className="h-80 overflow-hidden rounded-md bg-raised lg:h-96">
            {candles.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted">Đang kéo nến…</div>
            ) : (
              <PriceChart
                key={`${symbol}-${chartTf}`}
                candles={candles}
                signal={open ? null : shown}
                entry={open?.entry}
                sl={open?.sl}
                tp1={open?.tp1}
                tp2={open?.tp2}
                zones={htfZones}
                resetKey={`${symbol}-${chartTf}`}
              />
            )}
          </div>
        </section>

        <aside>
          <SignalPanel />
        </aside>
      </div>

      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl">Vị thế</h2>
          {positions.length ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const px = ticker?.price;
                positions.forEach((p) => {
                  const price = tickerOf(tickers, p.symbol)?.price ?? px ?? p.entry;
                  close(p.id, price, "Đóng hết");
                });
              }}
            >
              Đóng hết
            </Button>
          ) : null}
        </div>
        <PositionsBar />
      </section>
    </div>
  );
}
