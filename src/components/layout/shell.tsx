import { Link } from "@tanstack/react-router";
import { BookOpen, LayoutGrid, ScrollText, Settings } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Desk", icon: LayoutGrid },
  { to: "/journal", label: "Nhật ký", icon: ScrollText },
  { to: "/rules", label: "Rule", icon: BookOpen },
  { to: "/settings", label: "Cài đặt", icon: Settings },
] as const;

export function Shell({ children }: { children: ReactNode }) {
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
      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-3 py-4 pb-20 md:px-4 md:pb-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-bg/95 md:hidden">
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
