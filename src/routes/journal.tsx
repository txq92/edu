import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatPrice, formatUsd } from "@/lib/nukida/format";
import type { Position, Ticker } from "@/lib/nukida/types";
import { tickerOf, useMarket } from "@/lib/store/market";
import { usePaper } from "@/lib/store/paper";
import { useSettings } from "@/lib/store/settings";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/journal")({ component: JournalPage });

function JournalPage() {
  const history = usePaper((s) => s.history);
  const positions = usePaper((s) => s.positions);
  const tickers = useMarket((s) => s.tickers);
  const setSymbol = useSettings((s) => s.setSymbol);
  const navigate = useNavigate();

  const rows = [...positions, ...history].sort((a, b) => b.openedAt - a.openedAt);
  const stats = summarize(rows, tickers);

  function exportText() {
    const text = rows
      .map((p) => {
        const j = p.journal;
        return `Ngày: ${j.date}
Sản phẩm: ${j.product}
Hướng: ${j.side === "BUY" ? "LONG" : "SHORT"}
Khối lượng: ${p.notional}
Tiền ký quỹ: ${p.marginUsd ?? ""}
Đòn bẩy: ${p.leverage ?? ""}
Khung xương: ${j.skeletonTf}
Khung vào lệnh: ${j.entryTf}
Xu hướng khung lớn: ${j.htfTrend}
Vùng Bò Gấu: ${j.zone}
Tín hiệu nến / lực: ${j.candleForce}
Lý do vào: ${j.reason}
Điểm vào: ${j.entry}
Giờ vào: ${formatDateTime(p.openedAt)}
Giờ TP1: ${p.tp1At ? formatDateTime(p.tp1At) : ""}
Giờ TP2: ${p.tp2At ? formatDateTime(p.tp2At) : ""}
Giờ SL: ${p.slAt ? formatDateTime(p.slAt) : ""}
SL: ${j.sl}
TP1: ${j.tp1}
TP2: ${j.tp2}
R:R: ${j.rr}
Risk %: ${j.riskPct}
Có đủ checklist bắt buộc không? ${j.checklistOk ? "Có" : "Không"}
Kết quả: ${j.result ?? "đang chạy"}
Đúng rule hay sai rule: ${j.ruleOk === undefined ? "" : j.ruleOk ? "Đúng rule" : "Sai rule"}
Bài học: ${j.lesson ?? ""}
---`;
      })
      .join("\n\n");
    void navigator.clipboard.writeText(text || "Chưa có lệnh.");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Nhật ký</h1>
          <p className="mt-2 text-muted">Sổ lệnh futures USDT-M: LONG và SHORT. Mỗi lệnh ghi khối lượng tiền đã vào.</p>
        </div>
        <Button variant="outline" onClick={exportText}>
          Copy mẫu
        </Button>
      </div>
      <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Lệnh vào" value={String(stats.entered)} hint={`${stats.open} đang mở · ${stats.closed} đã đóng`} />
        <Stat label="Lời" value={String(stats.wins)} hint={formatUsd(stats.winUsd)} tone="bull" />
        <Stat label="Lỗ" value={String(stats.losses)} hint={formatUsd(stats.lossUsd)} tone="bear" />
        <Stat
          label="Lãi ròng"
          value={formatUsd(stats.net)}
          hint={stats.closed ? `Thắng ${stats.winRate.toFixed(0)}% lệnh đóng` : "Chưa có lệnh đóng"}
          tone={stats.net >= 0 ? "bull" : "bear"}
        />
      </section>
      <p className="mb-4 text-xs text-faint">
        Lời/lỗ tính trên lệnh đã đóng. Lệnh đang mở không tính thắng thua. Sổ JSON dùng chung mọi trình duyệt đã đăng nhập.
        {stats.open ? ` Đang mở: ${formatUsd(stats.openUsd)}.` : ""}
      </p>
      {!rows.length ? (
        <div className="rounded-xl bg-surface p-6 text-sm text-muted shadow-[var(--shadow-border)]">
          Chưa có lệnh. Khi vào từ Desk, plan được ghi tự động theo mẫu rule.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {[...rows].map((p) => {
            const px = tickerOf(tickers, p.symbol)?.price ?? p.entry;
            const dir = p.side === "BUY" ? 1 : -1;
            const u = p.status === "closed" ? p.realizedPnl : (px - p.entry) * dir * p.remainingQty + p.realizedPnl;
            return (
              <article key={p.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-xl">
                    {p.symbol.replace("USDT", "")} · {p.side === "BUY" ? "LONG" : "SHORT"}
                  </h2>
                  <span className={cn("font-mono tabular-nums", u >= 0 ? "text-bull" : "text-bear")}>{formatUsd(u)}</span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {p.symbol.replace("USDT", "")} · {p.setupName}
                </p>
                <Times position={p} />
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-xs text-faint">Vào</dt>
                    <dd className="font-mono">{formatPrice(p.entry)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-faint">SL</dt>
                    <dd className="font-mono">{formatPrice(p.sl)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-faint">TP1</dt>
                    <dd className="font-mono">{formatPrice(p.tp1)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-faint">Khối lượng</dt>
                    <dd className="font-mono">{formatUsd(p.notional, 0)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-faint">Tiền vào</dt>
                    <dd className="font-mono">{p.marginUsd != null ? formatUsd(p.marginUsd, 0) : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-faint">Đòn bẩy</dt>
                    <dd className="font-mono">{p.leverage ? `${p.leverage}x` : "—"}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-muted">{p.journal.candleForce}</p>
                <p className="mt-1 text-xs text-faint">
                  Checklist {p.journal.checklistOk ? "đủ" : "thiếu"} · {p.journal.result ?? p.status} · {p.mode}
                </p>
                {p.status !== "closed" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => {
                      setSymbol(p.symbol);
                      sessionStorage.setItem("meo-den-scroll-chart", "1");
                      void navigate({ to: "/" });
                    }}
                  >
                    Xem trên biểu đồ
                  </Button>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Times({ position: p }: { position: Position }) {
  const slAt = p.slAt ?? (p.journal.result?.startsWith("SL") ? p.closedAt : undefined);
  const tp2At = p.tp2At ?? (p.journal.result?.startsWith("TP2") ? p.closedAt : undefined);
  const rows = [
    ["Giờ vào", formatDateTime(p.openedAt)],
    tp1AtLabel(p.tp1At),
    tp2At ? ["Giờ TP2", formatDateTime(tp2At)] : null,
    slAt ? ["Giờ SL", formatDateTime(slAt)] : null,
  ].filter((row): row is [string, string] => Boolean(row));
  return (
    <dl className="mt-3 grid gap-1 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3">
          <dt className="text-faint">{k}</dt>
          <dd className="font-mono tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function tp1AtLabel(ts: number | undefined): [string, string] | null {
  return ts ? ["Giờ TP1", formatDateTime(ts)] : null;
}

function summarize(rows: Position[], tickers: Ticker[]) {
  let open = 0;
  let wins = 0;
  let losses = 0;
  let flat = 0;
  let winUsd = 0;
  let lossUsd = 0;
  let openUsd = 0;
  for (const p of rows) {
    if (p.status !== "closed") {
      open += 1;
      const px = tickerOf(tickers, p.symbol)?.price ?? p.entry;
      const dir = p.side === "BUY" ? 1 : -1;
      openUsd += (px - p.entry) * dir * p.remainingQty + p.realizedPnl;
      continue;
    }
    if (p.realizedPnl > 0) {
      wins += 1;
      winUsd += p.realizedPnl;
    } else if (p.realizedPnl < 0) {
      losses += 1;
      lossUsd += p.realizedPnl;
    } else {
      flat += 1;
    }
  }
  const closed = wins + losses + flat;
  return {
    entered: rows.length,
    open,
    closed,
    wins,
    losses,
    winUsd,
    lossUsd,
    net: winUsd + lossUsd,
    openUsd,
    winRate: closed ? (wins / closed) * 100 : 0,
  };
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "bull" | "bear";
}) {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="text-xs text-faint">{label}</p>
      <p className={cn("mt-1 font-mono text-xl tabular-nums", tone === "bull" && "text-bull", tone === "bear" && "text-bear")}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
