import { useEffect } from "react";
import { toast } from "sonner";
import { telegramSend } from "@/lib/telegram/api";
import { formatPrice, formatUsd } from "@/lib/nukida/format";
import type { Position, Signal } from "@/lib/nukida/types";
import { useAlerts } from "@/lib/store/alerts";
import { useMarket } from "@/lib/store/market";
import { useSettings } from "@/lib/store/settings";

const SEEN_KEY = "meo-den-alerted";
const KEEP_MS = 6 * 3600_000;

function seenMap(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function remember(key: string) {
  const map = seenMap();
  const now = Date.now();
  map[key] = now;
  for (const [k, t] of Object.entries(map)) {
    if (now - t > KEEP_MS) delete map[k];
  }
  sessionStorage.setItem(SEEN_KEY, JSON.stringify(map));
}

export function alertText(signal: Signal): string {
  const side = signal.side === "BUY" ? "LONG" : "SHORT";
  return [
    `Mèo Đen · TÍN HIỆU · chưa vào lệnh`,
    `${side} ${signal.symbol}`,
    signal.setupName,
    `Vào ${formatPrice(signal.entry)}`,
    `SL ${formatPrice(signal.sl)}`,
    `TP1 ${formatPrice(signal.tp1)}`,
    `TP2 ${formatPrice(signal.tp2)}`,
    `R:R ${signal.rr.toFixed(2)}`,
  ].join("\n");
}

function keyOf(signal: Signal) {
  return `${signal.symbol}-${signal.strategy}-${signal.side}`;
}

export function notifyFill(pos: Position, kind: "auto" | "force") {
  const settings = useSettings.getState();
  if (!settings.tgAlerts || !settings.tgToken || !settings.tgChatId) return;
  const side = pos.side === "BUY" ? "LONG" : "SHORT";
  const label = kind === "auto" ? "TỰ ĐỘNG" : "CƯỠNG BỨC";
  const text = [
    `Mèo Đen · ${label} ${side} ${pos.symbol}`,
    pos.mode === "live" ? "Lệnh thật" : "Lệnh giấy",
    pos.setupName,
    `Vào ${formatPrice(pos.entry)}`,
    `SL ${formatPrice(pos.sl)}`,
    `TP1 ${formatPrice(pos.tp1)}`,
    `TP2 ${formatPrice(pos.tp2)}`,
    `Khối lượng ${formatUsd(pos.notional, 0)} · ký quỹ ${pos.marginUsd != null ? formatUsd(pos.marginUsd, 0) : "—"} · ${pos.leverage ?? "—"}x`,
  ].join("\n");
  void telegramSend({ data: { token: settings.tgToken, chatId: settings.tgChatId, text } }).catch((e) => {
    toast.error(e instanceof Error ? e.message : "Không gửi được Telegram.");
  });
}

export function useSignalAlerts() {
  const signals = useMarket((s) => s.signals);
  const show = useAlerts((s) => s.show);
  const tgAlerts = useSettings((s) => s.tgAlerts);
  const tgToken = useSettings((s) => s.tgToken);
  const tgChatId = useSettings((s) => s.tgChatId);

  useEffect(() => {
    const live = signals.filter((s) => s.requiredPass && s.status === "live");
    const seen = seenMap();
    for (const signal of live) {
      const key = keyOf(signal);
      if (seen[key] && Date.now() - seen[key] < KEEP_MS) continue;
      remember(key);
      show(signal);
      const side = signal.side === "BUY" ? "LONG" : "SHORT";
      toast.message(`${side} ${signal.symbol.replace("USDT", "")}`, { description: signal.setupName });
      if (!tgAlerts || !tgToken || !tgChatId) continue;
      void telegramSend({ data: { token: tgToken, chatId: tgChatId, text: alertText(signal) } }).catch((e) => {
        toast.error(e instanceof Error ? e.message : "Không gửi được Telegram.");
      });
    }
  }, [signals, show, tgAlerts, tgToken, tgChatId]);
}
