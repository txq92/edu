import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useRules } from "@/lib/store/rules";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rules")({ component: RulesPage });

const BLOCKS = [
  {
    title: "Nguyên tắc cốt lõi",
    items: [
      "Ưu tiên cấu trúc trước điểm vào. Nến đẹp giữa nowhere = đứng ngoài.",
      "Trade theo phe đang thắng, không bắt đỉnh/đáy cảm tính.",
      "Ít lệnh, chất lượng cao. Không có setup sạch thì không vào.",
      "Luôn có Stop Loss. R:R tối thiểu theo số bạn đặt bên trên.",
      "Khung lớn quyết định hướng, khung nhỏ quyết định điểm vào.",
    ],
  },
  {
    title: "Ba lớp vào lệnh",
    items: [
      "Chỉ vào khi giá 5 phút chạm vùng Bò hoặc Gấu của H1/H4 và cùng chiều khung lớn.",
      "Breakout, EMA, VWAP chỉ là tín hiệu xác nhận trên 5 phút, không đủ để vào nếu chưa về vùng khung lớn.",
    ],
  },
  {
    title: "Vùng Bò Gấu",
    items: [
      "Vùng Bò và Vùng Gấu lấy trên H1 và H4, không lấy trên 15 phút.",
      "Long chỉ khi khung lớn tăng và giá 5 phút về vùng Bò. Short chỉ khi khung lớn giảm và giá 5 phút về vùng Gấu.",
      "Loại vùng giữa trend, vùng xuyên nhiều lần, vùng nhỏ ngược sóng mẹ.",
    ],
  },
  {
    title: "Quản lý vốn",
    items: [
      "Risk 0.5–1% tài khoản mỗi lệnh. Đòn bẩy chỉ để đạt notional, không phải lý do tăng risk.",
      "Không dời SL xa hơn khi đang lỗ. Không trung bình giá khi sai.",
      "2–3 lệnh thua đúng rule: halt trong ngày, review, không gỡ gạc.",
      "Đi được 1R: chốt 50%, dời SL hòa vốn.",
    ],
  },
  {
    title: "6 câu hỏi 20 giây",
    items: [
      "Khung lớn có ủng hộ hướng này không?",
      "Có đang đứng tại vùng Bò Gấu chất lượng không?",
      "Nến/lực có cho thấy phe mình bắt đầu thắng không?",
      "SL có chỗ đặt hợp lý không?",
      "R:R có đạt mức tối thiểu đang bật không?",
      "Mình có đang FOMO hoặc gỡ lỗ không?",
    ],
  },
];

const BANDS = [
  { value: 1, label: "Chặt" },
  { value: 1.6, label: "Vừa" },
  { value: 2.4, label: "Rộng" },
] as const;

function RulesPage() {
  const rules = useRules();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl">Rule</h1>
      <p className="mt-2 text-muted">
        Chỉnh cửa chặn rồi quay lại Desk. Auto paper dùng đúng bộ này. Lệnh thật vẫn phải bấm tay.
      </p>

      <section className="mt-8 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Tùy chỉnh</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => rules.reset()}>
              Rule gốc
            </Button>
            <Button size="sm" onClick={() => rules.useTest()}>
              Dễ test
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm">
            R:R tối thiểu
            <Input
              type="number"
              min={0.8}
              max={3}
              step={0.1}
              value={rules.minRr}
              onChange={(e) => rules.patch({ minRr: Number(e.target.value) })}
            />
          </label>
          <label className="grid gap-2 text-sm">
            Điểm vào lệnh tối thiểu
            <Input
              type="number"
              min={40}
              max={90}
              step={1}
              value={rules.minQuality}
              onChange={(e) => rules.patch({ minQuality: Number(e.target.value) })}
            />
          </label>
        </div>

        <div className="mt-5">
          <p className="text-sm">Độ nhạy vùng vào</p>
          <div className="mt-2 flex gap-2">
            {BANDS.map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={() => rules.patch({ sensitivity: b.value })}
                className={cn(
                  "min-h-11 flex-1 rounded-md border border-line text-sm",
                  Math.abs(rules.sensitivity - b.value) < 0.05 ? "bg-raised text-fg" : "text-muted",
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-faint">Chặt đúng mép EMA/VWAP/hộp. Rộng chấp nhận giá cách vùng xa hơn.</p>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <Toggle
            label="Bắt buộc H4/H1 cùng hướng"
            checked={rules.requireHtf}
            onChange={(v) => rules.patch({ requireHtf: v })}
          />
          <Toggle
            label="Chặn sóng kiệt sức"
            checked={rules.blockExhausted}
            onChange={(v) => rules.patch({ blockExhausted: v })}
          />
          <Toggle
            label="Né giờ funding"
            checked={rules.fundingFilter}
            onChange={(v) => rules.patch({ fundingFilter: v })}
          />
          {rules.fundingFilter ? (
            <label className="grid gap-2 pl-1 text-sm text-muted">
              Cửa sổ funding (phút)
              <Input
                type="number"
                min={0}
                max={60}
                step={1}
                value={rules.fundingWindowMin}
                onChange={(e) => rules.patch({ fundingWindowMin: Number(e.target.value) })}
              />
            </label>
          ) : null}
          <p className="text-sm text-muted">
            Bật Auto paper trên Desk thì mọi coin đang chữ Setup được vào lệnh giấy. Coin đã có vị thế thì bỏ qua.
          </p>
        </div>
      </section>

      <section className="mt-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl">Ví dụ tín hiệu vào lệnh</h2>
        <p className="mt-2 text-sm text-muted">BTC minh họa. Giá chỉ để thấy thứ tự, không phải tín hiệu lúc này.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-raised p-4">
            <p className="text-sm text-bull">Được vào · LONG</p>
            <ol className="mt-3 space-y-2 text-sm text-muted">
              <li>H4 đang tăng: đỉnh sau cao hơn đỉnh trước, đáy sau cao hơn đáy trước.</li>
              <li>H1 có vùng Bò 84,200–84,450. Đó là đáy H1 mà giá đã bật lên.</li>
              <li>Giá 5 phút hồi về 84,310, nằm trong vùng Bò. Nến 5 phút đóng cửa xanh, râu dưới giữ trên 84,200.</li>
              <li>Vào 84,310. SL dưới vùng, 83,960. TP theo R:R đang bật.</li>
            </ol>
            <p className="mt-3 text-xs text-faint">EMA hoặc VWAP trên 5 phút chỉ là xác nhận thêm. Thiếu vùng H1/H4 thì không vào.</p>
          </div>
          <div className="rounded-lg bg-raised p-4">
            <p className="text-sm text-bear">Không vào · giống lệnh vừa thua</p>
            <ol className="mt-3 space-y-2 text-sm text-muted">
              <li>H4 vẫn tăng hoặc đi ngang, không có xu hướng giảm.</li>
              <li>15 phút EMA quay xuống và giá bị từ chối tại VWAP.</li>
              <li>5 phút có nến đỏ, nhưng giá đang ở giữa, không chạm vùng Gấu của H1 hay H4.</li>
              <li>Bot bỏ. Không short chỉ vì hồi 15 phút.</li>
            </ol>
            <p className="mt-3 text-xs text-faint">Short chỉ khi H4 hoặc H1 đang giảm và giá 5 phút chạm vùng Gấu của chính khung đó.</p>
          </div>
        </div>
      </section>

      <div className="mt-4 flex flex-col gap-4">
        {BLOCKS.map((b) => (
          <section key={b.title} className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-2xl">{b.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {b.items.map((it) => (
                <li key={it} className="pl-1">
                  {it}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
      <span>
        {label}
        {hint ? <span className="mt-0.5 block text-xs text-faint">{hint}</span> : null}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
