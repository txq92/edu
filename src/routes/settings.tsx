import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatUsd } from "@/lib/nukida/format";
import { geoBlocked, testConnection } from "@/lib/binance/live";
import { usePaper } from "@/lib/store/paper";
import { useSession } from "@/lib/store/session";
import { useSettings } from "@/lib/store/settings";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const s = useSettings();
  const reset = usePaper((p) => p.reset);
  const setToken = useSession((s) => s.setToken);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function ping() {
    if (!s.apiKey || !s.apiSecret) {
      toast.error("Nhập API key và secret trước.");
      return;
    }
    setBusy(true);
    try {
      const res = await testConnection(s.apiKey, s.apiSecret, s.testnet);
      if (!res.ok) {
        if (geoBlocked(res.status, res.body)) {
          toast.error("Binance chặn khu vực máy chủ. Testnet hoặc lệnh giấy vẫn dùng được.");
        } else {
          toast.error(`Kết nối thất bại (${res.status}). Kiểm tra quyền Futures.`);
        }
        return;
      }
      toast.success("Kết nối Binance Futures OK.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi kết nối");
    } finally {
      setBusy(false);
    }
  }

  function armLive() {
    if (confirm !== "LIVE") {
      toast.error("Gõ LIVE để xác nhận. Lệnh thật sẽ gửi lên Binance.");
      return;
    }
    s.patch({ liveArmed: true });
    toast.success("Live đã bật. Size lệnh lấy từ mục Vốn bên trên.");
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-4xl">Cài đặt</h1>
      <p className="mt-2 text-sm text-muted">
        Key chỉ lưu trên máy này (trình duyệt). Secret được ký HMAC tại client, máy chủ chỉ chuyển tiếp request đã ký.
      </p>

      <section className="mt-8 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl">Mỗi lệnh</h2>
        <p className="mt-1 text-xs text-muted">Lệnh giấy và lệnh thật dùng cùng ba số này.</p>
        <div className="mt-4 grid gap-4">
          <Field label="Số tiền đánh mỗi lệnh (USDT)">
            <Input
              type="number"
              min={1}
              value={s.marginUsd}
              onChange={(e) => s.patch({ marginUsd: Math.max(0, Number(e.target.value) || 0), sizeBy: "margin" })}
            />
          </Field>
          <Field label="Đòn bẩy">
            <Input
              type="number"
              min={1}
              max={125}
              value={s.maxLeverage}
              onChange={(e) =>
                s.patch({ maxLeverage: Math.min(125, Math.max(1, Math.round(Number(e.target.value) || 1))) })
              }
            />
          </Field>
          <Field label="Lỗ chạm mức này thì SL (USDT)">
            <Input
              type="number"
              min={0}
              step={0.5}
              placeholder="Để trống = SL của tool"
              value={s.slUsd || ""}
              onChange={(e) => s.patch({ slUsd: Math.max(0, Number(e.target.value) || 0) })}
            />
          </Field>
          <p className="text-xs text-muted">
            {formatUsd(s.marginUsd, 0)} × {s.maxLeverage}x = khối lượng {formatUsd(s.marginUsd * s.maxLeverage, 0)}.{" "}
            {s.slUsd > 0
              ? `SL khi lỗ ${formatUsd(s.slUsd)}. TP tính lại theo R:R.`
              : "Không nhập ngưỡng thì SL và TP theo tính toán của tool."}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              reset(s.equity);
              toast.success("Đã reset tài khoản giấy.");
            }}
          >
            Reset tài khoản giấy
          </Button>
        </div>
      </section>

      <section className="mt-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl">Binance Futures</h2>
        <p className="mt-1 text-xs text-muted">
          Tạo API chỉ Futures, không rút tiền. Mặc định paper — live phải gõ LIVE.
        </p>
        <div className="mt-4 grid gap-3">
          <Field label="API Key">
            <Input value={s.apiKey} onChange={(e) => s.patch({ apiKey: e.target.value.trim() })} autoComplete="off" />
          </Field>
          <Field label="API Secret">
            <Input
              type="password"
              value={s.apiSecret}
              onChange={(e) => s.patch({ apiSecret: e.target.value.trim() })}
              autoComplete="off"
            />
          </Field>
          <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
            Testnet
            <Switch checked={s.testnet} onCheckedChange={(v) => s.patch({ testnet: v })} />
          </label>
          <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
            Auto paper khi đủ checklist
            <Switch checked={s.autoPaper} onCheckedChange={(v) => s.patch({ autoPaper: v })} />
          </label>
          <Button variant="outline" onClick={() => void ping()} disabled={busy}>
            {busy ? "Đang thử…" : "Thử kết nối"}
          </Button>
        </div>
      </section>

      <section className="mt-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl">Live</h2>
        {s.liveArmed ? (
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-sm text-bear">Live đang bật. Nút Gửi Binance sẽ đặt MARKET + SL/TP.</p>
            <Button variant="outline" onClick={() => s.patch({ liveArmed: false, autoLive: false })}>
              Tắt live
            </Button>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            <Field label="Gõ LIVE để bật">
              <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="LIVE" />
            </Field>
            <Button variant="bear" onClick={armLive}>
              Bật giao dịch thật
            </Button>
          </div>
        )}
      </section>

      <section className="mt-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl">Sổ JSON</h2>
        <p className="mt-1 text-sm text-muted">
          Lệnh và thống kê ghi vào sổ JSON dùng chung. API key vẫn chỉ nằm trên trình duyệt này.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => setToken(null)}>
          Đăng xuất
        </Button>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
