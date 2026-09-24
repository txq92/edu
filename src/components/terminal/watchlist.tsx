import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchTickers } from "@/lib/binance/api";
import { isDefaultSymbol, MAX_WATCH, normalizeSymbol, symbolMeta } from "@/lib/binance/constants";
import { formatPct, formatPrice } from "@/lib/nukida/format";
import { tickerOf, useMarket } from "@/lib/store/market";
import { useSettings } from "@/lib/store/settings";
import { cn } from "@/lib/utils";

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

  return (
    <div className="flex flex-col gap-1">
      <form onSubmit={onAdd} className="mb-2 flex gap-1">
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
      {watch.map((id) => {
        const s = symbolMeta(id);
        const t = tickerOf(tickers, id);
        const hit = hits.find((h) => h.symbol === id);
        const active = symbol === id;
        const up = (t?.changePct ?? 0) >= 0;
        const custom = !isDefaultSymbol(id);
        return (
          <div
            key={id}
            className={cn(
              "flex min-h-11 items-center rounded-md transition-colors duration-150",
              active ? "bg-raised" : "hover:bg-raised/60",
            )}
          >
            <button type="button" onClick={() => setSymbol(id)} className="flex min-w-0 flex-1 items-center justify-between px-3 py-2 text-left">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{s.label}</span>
                  {hit ? (
                    <span className={cn("text-xs", hit.side === "BUY" ? "text-bull" : "text-bear")}>
                      {hit.requiredPass ? "Setup" : "Theo dõi"}
                    </span>
                  ) : null}
                </div>
                <div className="truncate text-xs text-faint">{s.name}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm tabular-nums">{t ? formatPrice(t.price) : "—"}</div>
                <div className={cn("font-mono text-xs tabular-nums", up ? "text-bull" : "text-bear")}>
                  {t ? formatPct(t.changePct) : ""}
                </div>
              </div>
            </button>
            {custom ? (
              <button
                type="button"
                aria-label={`Xóa ${s.label}`}
                onClick={() => removeWatch(id)}
                className="mr-1 flex size-11 shrink-0 items-center justify-center text-faint hover:text-fg"
              >
                ×
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
