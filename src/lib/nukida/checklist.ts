import type { ChecklistItem, Side, Signal } from "./types";
import type { MarketPack } from "./strategies";
import { biasOf } from "./strategies";
import { closedOnly, nearFunding } from "./indicators";
import { detectZones, exhaustedMove, inZone, readStructure } from "./structure";
import { DEFAULT_RULES, type RuleConfig } from "./rules";

export function buildChecklist(signal: Signal, pack: MarketPack, rules: RuleConfig = DEFAULT_RULES): ChecklistItem[] {
  const side = signal.side;
  const buy = side === "BUY";
  const bias = biasOf(pack);
  const tf15 = closedOnly(pack.tf15);
  const struct = readStructure(tf15);
  const zones = detectZones(tf15);
  const tired = exhaustedMove(tf15, side);
  const funding = rules.fundingFilter && nearFunding(pack.now ?? Date.now(), rules.fundingWindowMin);
  const methodZone = signal.strategy === "ema" || signal.strategy === "vwap" || signal.strategy === "breakout";
  const atZone = methodZone || inZone(signal.entry, signal.zone, 0.002);
  const opposing =
    (buy && (bias.trendH4 === "down" || struct.trend === "down")) ||
    (!buy && (bias.trendH4 === "up" || struct.trend === "up"));

  const items: ChecklistItem[] = [
    {
      id: "a1",
      group: "A",
      required: true,
      label: buy
        ? "Khung lớn đang uptrend hoặc sideway phản ứng từ vùng Bò"
        : "Khung lớn đang downtrend hoặc sideway phản ứng từ vùng Gấu",
      pass: !rules.requireHtf || !opposing,
      note: bias.note,
    },
    {
      id: "a2",
      group: "A",
      required: true,
      label: buy ? "Không kiệt sức cuối sóng tăng" : "Không kiệt sức cuối sóng giảm",
      pass: !rules.blockExhausted || !tired,
    },
    {
      id: "a3",
      group: "A",
      required: true,
      label: buy ? "Không có cấu trúc giảm rõ trên khung xương" : "Không có cấu trúc tăng rõ trên khung xương",
      pass: !rules.requireHtf || (buy ? bias.trendH4 !== "down" : bias.trendH4 !== "up"),
      note: `H4/H1: ${bias.trendH4}`,
    },
    {
      id: "b1",
      group: "B",
      required: true,
      label: buy ? "Giá đang tại vùng Bò chất lượng" : "Giá đang tại vùng Gấu chất lượng",
      pass: atZone,
      note: signal.zone.label,
    },
    {
      id: "b2",
      group: "B",
      required: true,
      label: "Vùng trùng HL/LH hoặc mép hộp / EMA / VWAP",
      pass: Boolean(signal.zone),
    },
    {
      id: "b3",
      group: "B",
      required: true,
      label: "Vùng chưa bị phá vỡ rõ",
      pass: !struct.broken,
    },
    {
      id: "b4",
      group: "B",
      required: true,
      label: "Không phải vùng giữa nowhere",
      pass: atZone,
    },
    {
      id: "c1",
      group: "C",
      required: true,
      label: buy ? "Lực bán suy yếu khi vào vùng Bò" : "Lực mua suy yếu khi vào vùng Gấu",
      pass: signal.reasons.length > 0,
    },
    {
      id: "c2",
      group: "C",
      required: true,
      label: buy ? "Có tín hiệu Bò phản công" : "Có tín hiệu Gấu phản công",
      pass: signal.quality >= 58,
    },
    {
      id: "c3",
      group: "C",
      required: true,
      label: "Nếu breakout: đã phá rồi retest, không đuổi nến đầu",
      pass: signal.strategy !== "breakout" || signal.setupName.includes("retest"),
    },
    {
      id: "d1",
      group: "D",
      required: true,
      label: "Điểm vào rõ sau nến xác nhận",
      pass: signal.entry > 0,
    },
    {
      id: "d2",
      group: "D",
      required: true,
      label: buy ? "SL dưới vùng Bò / HL, có đệm" : "SL trên vùng Gấu / LH, có đệm",
      pass: buy ? signal.sl < signal.entry : signal.sl > signal.entry,
    },
    {
      id: "d3",
      group: "D",
      required: true,
      label: "TP1 hướng cấu trúc đối diện",
      pass: buy ? signal.tp1 > signal.entry : signal.tp1 < signal.entry,
    },
    {
      id: "d4",
      group: "D",
      required: true,
      label: `R:R tối thiểu 1 : ${rules.minRr}`,
      pass: signal.rr + 0.02 >= rules.minRr,
      note: `${signal.rr.toFixed(2)}R`,
    },
    {
      id: "e1",
      group: "E",
      required: false,
      label: "Hội tụ đa khung / đa setup",
      pass: signal.strategy === "confluence" || zones.length > 0,
    },
    {
      id: "e2",
      group: "E",
      required: false,
      label: "Không đang giật tin / funding",
      pass: !rules.fundingFilter || !funding,
    },
    {
      id: "e3",
      group: "E",
      required: false,
      label: "Setup sạch, không gượng ép",
      pass: signal.rejects.length === 0,
    },
    {
      id: "f1",
      group: "F",
      required: true,
      label: "Không vào vì FOMO",
      pass: true,
    },
    {
      id: "f2",
      group: "F",
      required: true,
      label: "Không vào để gỡ lỗ",
      pass: true,
    },
    {
      id: "f3",
      group: "F",
      required: true,
      label: "Đã ghi plan vào nhật ký trước khi bấm lệnh",
      pass: true,
    },
  ];
  return items;
}

export function idleChecklist(pack: MarketPack, side: Side, rules: RuleConfig = DEFAULT_RULES): ChecklistItem[] {
  const buy = side === "BUY";
  const bias = biasOf(pack);
  const tf15 = closedOnly(pack.tf15);
  const struct = readStructure(tf15);
  const zones = detectZones(tf15);
  const tired = exhaustedMove(tf15, side);
  const funding = rules.fundingFilter && nearFunding(pack.now ?? Date.now(), rules.fundingWindowMin);
  const opposing =
    (buy && (bias.trendH4 === "down" || struct.trend === "down")) ||
    (!buy && (bias.trendH4 === "up" || struct.trend === "up"));
  const kind = buy ? "bull" : "bear";
  const zone = zones.find((z) => z.kind === kind);

  const items: ChecklistItem[] = [
    {
      id: "a1",
      group: "A",
      required: true,
      label: buy
        ? "Khung lớn đang uptrend hoặc sideway phản ứng từ vùng Bò"
        : "Khung lớn đang downtrend hoặc sideway phản ứng từ vùng Gấu",
      pass: !rules.requireHtf || !opposing,
      note: bias.note,
    },
    {
      id: "a2",
      group: "A",
      required: true,
      label: buy ? "Không kiệt sức cuối sóng tăng" : "Không kiệt sức cuối sóng giảm",
      pass: !rules.blockExhausted || !tired,
    },
    {
      id: "a3",
      group: "A",
      required: true,
      label: buy ? "Không có cấu trúc giảm rõ trên khung xương" : "Không có cấu trúc tăng rõ trên khung xương",
      pass: !rules.requireHtf || (buy ? bias.trendH4 !== "down" : bias.trendH4 !== "up"),
      note: `H4/H1: ${bias.trendH4}`,
    },
    {
      id: "b1",
      group: "B",
      required: true,
      label: buy ? "Giá đang tại vùng Bò chất lượng" : "Giá đang tại vùng Gấu chất lượng",
      pass: false,
      note: zone ? `${zone.label} — chưa có nến vào` : "Chưa có vùng",
    },
    {
      id: "b2",
      group: "B",
      required: true,
      label: "Vùng trùng HL/LH hoặc mép hộp / EMA / VWAP",
      pass: Boolean(zone),
      note: zone?.label,
    },
    {
      id: "b3",
      group: "B",
      required: true,
      label: "Vùng chưa bị phá vỡ rõ",
      pass: !struct.broken,
    },
    {
      id: "b4",
      group: "B",
      required: true,
      label: "Không phải vùng giữa nowhere",
      pass: false,
      note: "Chưa có setup",
    },
    {
      id: "c1",
      group: "C",
      required: true,
      label: buy ? "Lực bán suy yếu khi vào vùng Bò" : "Lực mua suy yếu khi vào vùng Gấu",
      pass: false,
      note: "Chưa có nến xác nhận",
    },
    {
      id: "c2",
      group: "C",
      required: true,
      label: buy ? "Có tín hiệu Bò phản công" : "Có tín hiệu Gấu phản công",
      pass: false,
    },
    {
      id: "c3",
      group: "C",
      required: true,
      label: "Nếu breakout: đã phá rồi retest, không đuổi nến đầu",
      pass: false,
      note: "Chưa có breakout",
    },
    {
      id: "d1",
      group: "D",
      required: true,
      label: "Điểm vào rõ sau nến xác nhận",
      pass: false,
    },
    {
      id: "d2",
      group: "D",
      required: true,
      label: buy ? "SL dưới vùng Bò / HL, có đệm" : "SL trên vùng Gấu / LH, có đệm",
      pass: false,
    },
    {
      id: "d3",
      group: "D",
      required: true,
      label: "TP1 hướng cấu trúc đối diện",
      pass: false,
    },
    {
      id: "d4",
      group: "D",
      required: true,
      label: `R:R tối thiểu 1 : ${rules.minRr}`,
      pass: false,
      note: "Chưa có lệnh",
    },
    {
      id: "e1",
      group: "E",
      required: false,
      label: "Hội tụ đa khung / đa setup",
      pass: zones.length > 0,
    },
    {
      id: "e2",
      group: "E",
      required: false,
      label: "Không đang giật tin / funding",
      pass: !rules.fundingFilter || !funding,
    },
    {
      id: "e3",
      group: "E",
      required: false,
      label: "Setup sạch, không gượng ép",
      pass: false,
      note: "Đang đứng ngoài",
    },
    {
      id: "f1",
      group: "F",
      required: true,
      label: "Không vào vì FOMO",
      pass: true,
    },
    {
      id: "f2",
      group: "F",
      required: true,
      label: "Không vào để gỡ lỗ",
      pass: true,
    },
    {
      id: "f3",
      group: "F",
      required: true,
      label: "Đã ghi plan vào nhật ký trước khi bấm lệnh",
      pass: true,
    },
  ];
  return items;
}

export function requiredOk(items: ChecklistItem[]): boolean {
  return items.filter((i) => i.required).every((i) => i.pass);
}

export function attachChecklist(signal: Signal, pack: MarketPack, rules: RuleConfig = DEFAULT_RULES): Signal {
  const checklist = buildChecklist(signal, pack, rules);
  const ok = requiredOk(checklist) && signal.rejects.length === 0;
  return {
    ...signal,
    checklist,
    requiredPass: ok,
    status: ok ? "live" : "watch",
  };
}
