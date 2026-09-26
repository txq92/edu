import { Button } from "@/components/ui/button";
import { formatPrice, formatUsd } from "@/lib/nukida/format";
import { usePaper } from "@/lib/store/paper";
import { tickerOf, useMarket } from "@/lib/store/market";
import { useSettings } from "@/lib/store/settings";
import { cn } from "@/lib/utils";

export function PositionsBar() {
  const positions = usePaper((s) => s.positions);
  const tickers = useMarket((s) => s.tickers);
  const close = usePaper((s) => s.close);
  const haltUntil = usePaper((s) => s.haltUntil);
  const symbol = useSettings((s) => s.symbol);
  const setSymbol = useSettings((s) => s.setSymbol);
  const halted = Date.now() < haltUntil;
  const resume = usePaper((s) => s.resume);

  function openOnChart(next: string) {
    setSymbol(next);
    document.getElementById("desk-chart")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (!positions.length) {
    return (
      <div className="rounded-lg bg-raised px-4 py-3 text-sm text-muted">
        {halted ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Đã halt sau 3 lệnh thua trong ngày — đứng ngoài, review rule.</span>
            <Button size="sm" variant="outline" onClick={() => resume()}>
              Vào lệnh lại
            </Button>
          </div>
        ) : (
          "Chưa có vị thế. Đợi setup đủ A+B+C+D+F rồi vào."
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {halted ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-raised px-4 py-3 text-sm text-muted">
          <span>Đã halt sau 3 lệnh thua trong ngày — đứng ngoài, review rule.</span>
          <Button size="sm" variant="outline" onClick={() => resume()}>
            Vào lệnh lại
          </Button>
        </div>
      ) : null}
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-faint">
          <tr>
            <th className="py-2 pr-4 font-medium">Cặp</th>
            <th className="pr-4 font-medium">Hướng</th>
            <th className="pr-4 font-medium">Tiền vào</th>
            <th className="pr-4 font-medium">Khối lượng</th>
            <th className="pr-4 font-medium">Vào</th>
            <th className="pr-4 font-medium">SL</th>
            <th className="pr-4 font-medium">TP1</th>
            <th className="pr-4 font-medium">PnL</th>
            <th className="font-medium" />
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => {
            const px = tickerOf(tickers, p.symbol)?.price ?? p.entry;
            const dir = p.side === "BUY" ? 1 : -1;
            const u = (px - p.entry) * dir * p.remainingQty + p.realizedPnl;
            const active = symbol === p.symbol;
            return (
              <tr
                key={p.id}
                className={cn("cursor-pointer border-t border-line", active ? "bg-raised" : "hover:bg-raised/60")}
                onClick={() => openOnChart(p.symbol)}
              >
                <td className="py-3 pr-4">
                  {p.symbol.replace("USDT", "")}
                  <div className="text-xs text-faint">
                    {p.symbol.replace("USDT", "")} · {p.setupName}
                  </div>
                </td>
                <td className={p.side === "BUY" ? "pr-4 text-bull" : "pr-4 text-bear"}>
                  {p.side === "BUY" ? "LONG" : "SHORT"}
                </td>
                <td className="pr-4 font-mono tabular-nums">
                  {p.marginUsd != null ? formatUsd(p.marginUsd, 0) : "—"}
                </td>
                <td className="pr-4 font-mono tabular-nums">{formatUsd(p.notional, 0)}</td>
                <td className="pr-4 font-mono tabular-nums">{formatPrice(p.entry)}</td>
                <td className="pr-4 font-mono tabular-nums">{formatPrice(p.sl)}</td>
                <td className="pr-4 font-mono tabular-nums">{formatPrice(p.tp1)}</td>
                <td className={cn("pr-4 font-mono tabular-nums", u >= 0 ? "text-bull" : "text-bear")}>
                  {formatUsd(u)}
                </td>
                <td>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      close(p.id, px, "Đóng tay");
                    }}
                  >
                    Đóng
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
