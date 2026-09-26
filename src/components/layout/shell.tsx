import { Link } from "@tanstack/react-router";
import { BookOpen, FlaskConical, LayoutGrid, ScrollText, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { useSignalAlerts } from "@/hooks/use-signal-alerts";
import { formatPrice } from "@/lib/nukida/format";
import { useAlerts } from "@/lib/store/alerts";

const NAV = [
  { to: "/", label: "Desk", icon: LayoutGrid },
  { to: "/journal", label: "Nhật ký", icon: ScrollText },
  { to: "/rules", label: "Rule", icon: BookOpen },
  { to: "/backtest", label: "Test", icon: FlaskConical },
  { to: "/settings", label: "Cài đặt", icon: Settings },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  useSignalAlerts();
  const alert = useAlerts((s) => s.current);
  const dismiss = useAlerts((s) => s.dismiss);
  const buy = alert?.side === "BUY";

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/cat-logo-gold.jpg"
              alt=""
              width={40}
              height={40}
              className="size-10 rounded-md object-cover shadow-[var(--shadow-border)]"
            />
            <span className="flex items-baseline gap-3">
              <span className="font-display text-xl">Mèo Đen</span>
              <span className="hidden text-xs tracking-wide text-muted sm:inline">Luật Bò Gấu</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-sm px-3 py-2 text-sm text-muted transition-colors duration-150 hover:bg-raised hover:text-fg data-[status=active]:bg-raised data-[status=active]:text-fg"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {alert ? (
        <div className="border-b border-line bg-raised px-4 py-3">
          <div className="mx-auto flex max-w-screen-2xl items-start justify-between gap-3">
            <div>
              <p className="text-sm text-fg">
                {alert.symbol.replace("USDT", "")} · {alert.setupName}
              </p>
              <p className={`mt-1 text-sm ${buy ? "text-bull" : "text-bear"}`}>{buy ? "LONG" : "SHORT"}</p>
              <p className="mt-1 font-mono text-xs text-muted">
                Vào {formatPrice(alert.entry)} · SL {formatPrice(alert.sl)} · TP1 {formatPrice(alert.tp1)} · TP2{" "}
                {formatPrice(alert.tp2)}
              </p>
            </div>
            <button type="button" onClick={dismiss} className="min-h-11 shrink-0 px-2 text-sm text-muted">
              Đóng
            </button>
          </div>
        </div>
      ) : null}
      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-3 py-4 pb-20 md:px-4 md:pb-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-bg/95 md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex min-h-14 flex-col items-center justify-center gap-1 text-faint data-[status=active]:text-fg"
          >
            <item.icon className="size-4" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
