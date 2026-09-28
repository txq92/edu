import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchTickers } from "@/lib/binance/api";
import { MAX_WATCH, normalizeSymbol, symbolMeta } from "@/lib/binance/constants";
import { formatPct, formatPrice, formatTime } from "@/lib/nukida/format";
import { tickerOf, useMarket, type ScanPhase } from "@/lib/store/market";
import { useSettings } from "@/lib/store/settings";
import { cn } from "@/lib/utils";

const FILTERS: { id: "all" | ScanPhase; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "nen", label: "Nên làm" },
  { id: "trong", label: "Trong vùng" },
  { id: "cho", label: "Chờ hồi" },
  { id: "ngoai", label: "Đứng ngoài" },
];

const PHASE_LABEL: Record<ScanPhase, string> = {
  nen: "Nên làm",
  trong: "Trong vùng",
  cho: "Chờ hồi",
  ngoai: "Đứng ngoài",
};

export function Watchlist() {
  const symbol = useSettings((s) => s.symbol);
  const watch = useSettings((s) => s.watch);
  const setSymbol = useSettings((s) => s.setSymbol);
  const addWatch = useSettings((s) => s.addWatch);
  const removeWatch = useSettings((s) => s.removeWatch);
  const tickers = useMarket((s) => s.tickers);
  const hits = useMarket((s) => s.watchHits);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    const id = normalizeSymbol(draft);
    if (!id) {
      toast.error("Nhập mã coin, ví dụ DOGE hoặc LINK.");
      return;
    }
    if (watch.includes(id)) {
      setSymbol(id);
      setDraft("");
      return;
    }
    if (watch.length >= MAX_WATCH) {
      toast.error(`Tối đa ${MAX_WATCH} cặp. Xóa bớt coin đã thêm.`);
      return;
    }
    setBusy(true);
    try {
      const rows = await fetchTickers({ data: { symbols: [id] } });
      const hit = rows.find((r) => r.symbol === id && r.price > 0);
      if (!hit) {
        toast.error(`${id.replace("USDT", "")} không có cặp USDT trên Binance.`);
        return;
      }
      addWatch(id);
      setDraft("");
      toast.success(`Đã thêm ${id.replace("USDT", "")}`);
    } catch {
      toast.error("Không kiểm tra được cặp. Thử lại.");
    } finally {
      setBusy(false);
    }
  }

  const ready = watch.filter((id) => hits.some((h) => h.symbol === id)).length;
  const shown = watch.filter((id) => {
    if (filter === "all") return true;
    return hits.find((h) => h.symbol === id)?.phase === filter;
  });

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-faint">
        Đã đọc {ready}/{watch.length} mã
      </p>
      <div className="flex gap-1 overflow-x-auto">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "h-9 shrink-0 rounded-md border border-line px-3 text-xs",
              filter === item.id ? "bg-raised text-fg" : "text-muted",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <form onSubmit={onAdd} className="flex gap-1">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="DOGE, LINK…"
          aria-label="Thêm coin"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="h-11 min-w-0 font-mono uppercase"
          disabled={busy}
        />
        <Button type="submit" size="sm" className="h-11 shrink-0 px-3" disabled={busy}>
          Thêm
        </Button>
      </form>
      <div className="flex max-h-[460px] flex-col gap-2 overflow-y-auto overscroll-contain pr-1">
        {shown.map((id) => {
          const s = symbolMeta(id);
          const t = tickerOf(tickers, id);
          const hit = hits.find((h) => h.symbol === id);
          const active = symbol === id;
          const up = (t?.changePct ?? 0) >= 0;
          const phase = hit?.phase ?? "ngoai";
          const trend = hit?.trend === "up" ? "Tăng" : hit?.trend === "down" ? "Giảm" : "Ngang";
          return (
            <div
              key={id}
              className={cn("shrink-0 rounded-lg bg-raised/70", active && "ring-1 ring-line")}
            >
              <button type="button" onClick={() => setSymbol(id)} className="w-full px-3 py-2.5 text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {s.label} <span className="font-normal text-faint">{s.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm tabular-nums">{t ? formatPrice(t.price) : "—"}</div>
                    <div className={cn("font-mono text-xs tabular-nums", up ? "text-bull" : "text-bear")}>
                      {t ? formatPct(t.changePct) : ""}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-md bg-surface px-2 py-1 text-xs",
                      phase === "nen" && (hit?.side === "SELL" ? "text-bear" : "text-bull"),
                      phase === "trong" && "text-warn",
                      phase === "cho" && "text-muted",
                      phase === "ngoai" && "text-faint",
                    )}
                  >
                    {hit ? PHASE_LABEL[phase] : "Đang đọc"}
                  </span>
                  <span className={cn("text-xs", hit?.trend === "down" ? "text-bear" : hit?.trend === "up" ? "text-bull" : "text-faint")}>
                    {hit ? trend : ""}
                  </span>
                </div>
                <p className="mt-1.5 font-mono text-xs text-muted">
                  {hit?.entry
                    ? `Vào ${formatPrice(hit.entry)} · SL ${formatPrice(hit.sl)} · ${hit.rr.toFixed(1)}R`
                    : "Chưa có mức vào"}
                  {hit?.at ? ` · ${formatTime(hit.at)}` : ""}
                </p>
                {hit?.setupName ? <p className="mt-1 truncate text-xs text-faint">{hit.setupName}</p> : null}
              </button>
              {watch.length > 1 ? (
                <button
                  type="button"
                  aria-label={`Xóa ${s.label}`}
                  onClick={() => removeWatch(id)}
                  className="w-full border-t border-line py-1 text-xs text-faint"
                >
                  Xóa
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}