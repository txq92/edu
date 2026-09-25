import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { geoBlocked, placeLive } from "@/lib/binance/live";
import { formatPrice, formatUsd } from "@/lib/nukida/format";
import { notifyFill } from "@/hooks/use-signal-alerts";
import { forcedSignal } from "@/lib/nukida/force";
import { idleChecklist } from "@/lib/nukida/checklist";
import { moneySl, orderSize } from "@/lib/nukida/risk";
import type { ChecklistItem, Side, Signal } from "@/lib/nukida/types";
import { packOf, tickerOf, useMarket } from "@/lib/store/market";
import { usePaper } from "@/lib/store/paper";
import { useRules } from "@/lib/store/rules";
import { useSettings } from "@/lib/store/settings";
import { cn } from "@/lib/utils";

export function SignalPanel() {
  const signals = useMarket((s) => s.signals);
  const books = useMarket((s) => s.books);
  const symbol = useSettings((s) => s.symbol);
  const view = useSettings((s) => s.userView);
  const rules = useRules();
  const live = signals.find((s) => s.requiredPass) ?? signals[0] ?? null;
  const pack = packOf(books, symbol);
  const items = live?.checklist.length ? live.checklist : pack ? idleChecklist(pack, view, rules) : [];

  return (
    <div className="flex flex-col gap-4">
      {live ? (
        <SignalCard signal={live} others={signals.filter((s) => s.id !== live.id)} />
      ) : (
        <div className="rounded-lg bg-raised p-4">
          <p className="font-display text-lg">Đứng ngoài</p>
          <p className="mt-2 text-sm text-muted">
            Không có setup đủ điều kiện. Checklist bên dưới vẫn chấm theo khung lớn và view bạn đang chọn.
          </p>
        </div>
      )}
      <Checklist items={items} />
      <ForceEntry />
    </div>
  );
}

function SignalCard({ signal, others }: { signal: Signal; others: Signal[] }) {
  const filters = useMarket((s) => s.filters);
  const settings = useSettings();
  const paper = usePaper();
  const minRr = useRules((s) => s.minRr);
  const planned = moneySl(signal, {
    marginUsd: settings.marginUsd,
    leverage: settings.maxLeverage,
    slUsd: settings.slUsd,
    minRr,
    step: filters.step,
  });
  const size = orderSize(settings, planned.entry, planned.sl, filters.step);
  const buy = planned.side === "BUY";

  async function enterPaper() {
    const pos = paper.placeFromSignal(planned, {
      equity: settings.equity,
      riskPct: settings.riskPct,
      step: filters.step,
      leverage: settings.maxLeverage,
      marginUsd: settings.marginUsd,
      sizeBy: "margin",
      mode: "paper",
    });
    if (!pos) {
      toast.error("Không vào được — đang halt, trùng vị thế, hoặc thiếu size.");
      return;
    }
    toast.success(`Đã vào lệnh giấy ${buy ? "MUA" : "BÁN"} ${signal.symbol}`);
  }

  async function enterLive() {
    if (!settings.liveArmed || !settings.apiKey || !settings.apiSecret) {
      toast.error("Bật Live và nhập API key trong Cài đặt trước.");
      return;
    }
    try {
      const res = await placeLive({
        apiKey: settings.apiKey,
        apiSecret: settings.apiSecret,
        testnet: settings.testnet,
        signal: planned,
        equity: settings.equity,
        riskPct: settings.riskPct,
        step: filters.step,
        leverage: settings.maxLeverage,
        marginUsd: settings.marginUsd,
        sizeBy: "margin",
      });
      if (!res.order.ok) {
        if (geoBlocked(res.order.status, res.order.body)) {
          toast.error("Binance chặn khu vực máy chủ. Dùng lệnh giấy, hoặc testnet.");
        } else {
          toast.error(`Lệnh live thất bại (${res.order.status})`);
        }
        return;
      }
      paper.placeFromSignal(planned, {
        equity: settings.equity,
        riskPct: settings.riskPct,
        step: filters.step,
        leverage: settings.maxLeverage,
        marginUsd: settings.marginUsd,
        sizeBy: "margin",
        mode: "live",
      });
      toast.success("Đã gửi lệnh Binance Futures + SL/TP.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi live order");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg bg-raised p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-wide text-muted uppercase">Setup</p>
            <h2 className="font-display text-2xl">{signal.setupName}</h2>
          </div>
          <Badge tone={signal.requiredPass ? (buy ? "bull" : "bear") : "warn"}>
            {signal.requiredPass ? "ĐƯỢC VÀO" : "THEO DÕI"}
          </Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone={buy ? "bull" : "bear"}>{buy ? "MUA" : "BÁN"}</Badge>
          <Badge>{signal.strategy.toUpperCase()}</Badge>
          <Badge>Q {Math.round(signal.quality)}</Badge>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Stat k="Vào" v={formatPrice(planned.entry)} />
          <Stat k="SL" v={formatPrice(planned.sl)} />
          <Stat k="TP1 1.5R" v={formatPrice(planned.tp1)} />
          <Stat k="TP2 2.5R" v={formatPrice(planned.tp2)} />
          <Stat k="R:R" v={planned.rr.toFixed(2)} />
          <Stat k="Size" v={`${size.qty || "—"} · ${formatUsd(size.notional, 0)}`} />
        </dl>
        <p className="mt-3 text-xs text-muted">
          {formatUsd(settings.marginUsd, 0)} × {settings.maxLeverage}x · lỗ SL{" "}
          {settings.slUsd > 0 ? formatUsd(settings.slUsd) : formatUsd(size.riskUsd)}
        </p>
        <ul className="mt-3 space-y-1 text-sm text-muted">
          {signal.reasons.map((r) => (
            <li key={r}>· {r}</li>
          ))}
          {signal.rejects.map((r) => (
            <li key={r} className="text-warn">
              · {r}
            </li>
          ))}
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant={buy ? "bull" : "bear"} onClick={() => void enterPaper()} disabled={!signal.requiredPass}>
            Vào lệnh giấy
          </Button>
          <Button variant="outline" onClick={() => void enterLive()} disabled={!signal.requiredPass}>
            Gửi Binance
          </Button>
        </div>
      </div>

      {others.length ? (
        <div className="rounded-lg bg-raised p-3">
          <p className="mb-2 text-xs text-muted">Setup khác trên cặp này</p>
          {others.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-1 text-sm">
              <span>{s.setupName}</span>
              <span className={s.side === "BUY" ? "text-bull" : "text-bear"}>Q{Math.round(s.quality)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ForceEntry() {
  const symbol = useSettings((s) => s.symbol);
  const view = useSettings((s) => s.userView);
  const patch = useSettings((s) => s.patch);
  const settings = useSettings();
  const minRr = useRules((s) => s.minRr);
  const books = useMarket((s) => s.books);
  const tickers = useMarket((s) => s.tickers);
  const filters = useMarket((s) => s.filters);
  const paper = usePaper();
  const price = tickerOf(tickers, symbol)?.price ?? 0;
  const raw =
    price > 0
      ? forcedSignal({
          symbol,
          side: view,
          price,
          candles: books[symbol]?.["5m"] ?? [],
          minRr,
        })
      : null;
  const plan = raw
    ? moneySl(raw, {
        marginUsd: settings.marginUsd,
        leverage: settings.maxLeverage,
        slUsd: settings.slUsd,
        minRr,
        step: filters.step,
      })
    : null;
  const size = plan ? orderSize(settings, plan.entry, plan.sl, filters.step) : null;
  const buy = view === "BUY";

  async function enter(mode: "paper" | "live") {
    if (!plan) {
      toast.error("Chưa có giá. Đợi ticker.");
      return;
    }
    if (mode === "live") {
      if (!settings.liveArmed || !settings.apiKey || !settings.apiSecret) {
        toast.error("Bật Live và nhập API trong Cài đặt trước.");
        return;
      }
      try {
        const res = await placeLive({
          apiKey: settings.apiKey,
          apiSecret: settings.apiSecret,
          testnet: settings.testnet,
          signal: plan,
          equity: settings.equity,
          riskPct: settings.riskPct,
          step: filters.step,
          leverage: settings.maxLeverage,
          marginUsd: settings.marginUsd,
          sizeBy: "margin",
        });
        if (!res.order.ok) {
          if (geoBlocked(res.order.status, res.order.body)) {
            toast.error("Binance chặn khu vực máy chủ.");
          } else {
            toast.error(`Lệnh live thất bại (${res.order.status})`);
          }
          return;
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Lỗi live order");
        return;
      }
    }
    const pos = paper.placeFromSignal(plan, {
      equity: settings.equity,
      riskPct: settings.riskPct,
      step: filters.step,
      leverage: settings.maxLeverage,
      marginUsd: settings.marginUsd,
      sizeBy: "margin",
      mode,
      force: true,
    });
    if (!pos) {
      toast.error("Không vào được — cặp này đang có vị thế, hoặc size bằng 0.");
      return;
    }
    toast.success(`Cưỡng bức ${buy ? "MUA" : "BÁN"} ${symbol.replace("USDT", "")}`);
    notifyFill(pos, "force");
  }

  return (
    <div className="rounded-lg bg-raised p-4">
      <p className="text-xs tracking-wide text-muted uppercase">View của bạn</p>
      <h2 className="font-display text-2xl">Vào cưỡng bức</h2>
      <p className="mt-1 text-xs text-muted">Bỏ checklist. Vẫn có SL theo ATR và size theo vốn đã đặt.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(["BUY", "SELL"] as Side[]).map((side) => (
          <button
            key={side}
            type="button"
            onClick={() => patch({ userView: side })}
            className={cn(
              "min-h-11 rounded-md border border-line text-sm",
              view === side ? (side === "BUY" ? "bg-bull text-bg" : "bg-bear text-fg") : "text-muted",
            )}
          >
            {side === "BUY" ? "View MUA" : "View BÁN"}
          </button>
        ))}
      </div>
      {plan && size ? (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Stat k="Vào" v={formatPrice(plan.entry)} />
          <Stat k="SL" v={formatPrice(plan.sl)} />
          <Stat k="TP1" v={formatPrice(plan.tp1)} />
          <Stat k="TP2" v={formatPrice(plan.tp2)} />
          <Stat k="Size" v={`${size.qty || "—"} · ${formatUsd(size.notional, 0)}`} />
          <Stat k="Risk" v={formatUsd(size.riskUsd)} />
        </dl>
      ) : (
        <p className="mt-3 text-sm text-muted">Đang chờ giá.</p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant={buy ? "bull" : "bear"} onClick={() => void enter("paper")} disabled={!plan}>
          Vào giấy
        </Button>
        <Button variant="outline" onClick={() => void enter("live")} disabled={!plan}>
          Gửi Binance
        </Button>
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-faint">{k}</dt>
      <dd className="font-mono tabular-nums">{v}</dd>
    </div>
  );
}

function Checklist({ items }: { items: ChecklistItem[] }) {
  const groups = ["A", "B", "C", "D", "E", "F"] as const;
  const titles: Record<(typeof groups)[number], string> = {
    A: "Hướng",
    B: "Vùng",
    C: "Hành vi",
    D: "Vào / SL / TP",
    E: "Bộ lọc phụ",
    F: "Tâm lý",
  };
  return (
    <div className="rounded-lg bg-raised p-4">
      <p className="mb-3 text-xs tracking-wide text-muted uppercase">Checklist Luật Bò Gấu</p>
      {groups.map((g) => (
        <div key={g} className="mb-3 last:mb-0">
          <p className="mb-1 text-xs font-medium text-fg">
            {g}. {titles[g]}
          </p>
          <ul className="space-y-1">
            {items
              .filter((i) => i.group === g)
              .map((i) => (
                <li key={i.id} className="flex items-start gap-2 text-xs">
                  <span className={cn("mt-0.5 font-mono", i.pass ? "text-bull" : "text-bear")}>
                    {i.pass ? "[x]" : "[ ]"}
                  </span>
                  <span className={i.pass ? "text-muted" : "text-fg"}>
                    {i.label}
                    {i.required ? "" : " (phụ)"}
                    {i.note ? <span className="text-faint"> — {i.note}</span> : null}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
