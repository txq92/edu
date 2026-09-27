import type { ChecklistItem, Side, Signal } from "./types";
import type { MarketPack } from "./strategies";
import { frameZones, higherTrend, zoneHit } from "./strategies";
import { closedOnly, nearFunding } from "./indicators";
import { exhaustedMove, readStructure } from "./structure";
import { DEFAULT_RULES, type RuleConfig } from "./rules";

function trendWord(trend: "up" | "down" | "side") {
  if (trend === "up") return "tăng";
  if (trend === "down") return "giảm";
  return "đi ngang";
}

function higherLine(side: Side, trend: "up" | "down" | "side") {
  const buy = side === "BUY";
  const aligned = buy ? trend === "up" : trend === "down";
  const order = buy ? "mua" : "bán";
  const word = trendWord(trend);
  const note =
    trend === "side"
      ? "Khung lớn H4/H1 đi ngang — đứng ngoài."
      : !aligned && buy
        ? "Khung lớn H4/H1 đang giảm — không mua."
        : !aligned
          ? "Khung lớn H4/H1 đang tăng — không bán."
          : `H4/H1 đang ${word}, cùng chiều lệnh ${order}.`;
  return {
    aligned,
    label: `Cần H4/H1 cùng chiều lệnh ${order}. Đang ${word}`,
    note,
  };
}

export function buildChecklist(signal: Signal, pack: MarketPack, rules: RuleConfig = DEFAULT_RULES): ChecklistItem[] {
  const side = signal.side;
  const buy = side === "BUY";
  const tf15 = closedOnly(pack.tf15);
  const htf = readStructure(closedOnly(pack.tfH4.length ? pack.tfH4 : pack.tfH1));
  const tired = exhaustedMove(tf15, side);
  const funding = rules.fundingFilter && nearFunding(pack.now ?? Date.now(), rules.fundingWindowMin);
  const hit = zoneHit(pack, side, signal.entry, rules.sensitivity);
  const trend = higherTrend(pack);
  const higher = higherLine(side, trend);

  const items: ChecklistItem[] = [
    {
      id: "a1",
      group: "A",
      required: true,
      label: higher.label,
      pass: !rules.requireHtf || higher.aligned,
      note: higher.note,
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
      label: "Cấu trúc H4/H1 không được ngược lệnh",
      pass: !rules.requireHtf || higher.aligned,
      note: higher.note,
    },
    {
      id: "b1",
      group: "B",
      required: true,
      label: buy ? "Giá 5m đang tại vùng Bò của H1 hoặc H4" : "Giá 5m đang tại vùng Gấu của H1 hoặc H4",
      pass: Boolean(hit),
      note: hit?.label ?? "Chưa chạm vùng khung lớn",
    },
    {
      id: "b2",
      group: "B",
      required: true,
      label: "Vùng lấy từ H1 hoặc H4, không phải vùng giữa",
      pass: Boolean(hit),
    },
    {
      id: "b3",
      group: "B",
      required: true,
      label: "Vùng khung lớn chưa bị phá vỡ rõ",
      pass: !htf.broken,
    },
    {
      id: "b4",
      group: "B",
      required: true,
      label: "Không phải vùng giữa nowhere",
      pass: Boolean(hit),
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
      pass: signal.strategy === "confluence" || frameZones(pack).length > 0,
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
  const tf15 = closedOnly(pack.tf15);
  const htf = readStructure(closedOnly(pack.tfH4.length ? pack.tfH4 : pack.tfH1));
  const tired = exhaustedMove(tf15, side);
  const funding = rules.fundingFilter && nearFunding(pack.now ?? Date.now(), rules.fundingWindowMin);
  const trend = higherTrend(pack);
  const higher = higherLine(side, trend);

  const items: ChecklistItem[] = [
    {
      id: "a1",
      group: "A",
      required: true,
      label: higher.label,
      pass: !rules.requireHtf || higher.aligned,
      note: higher.note,
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
      label: "Cấu trúc H4/H1 không được ngược lệnh",
      pass: !rules.requireHtf || higher.aligned,
      note: higher.note,
    },
    {
      id: "b1",
      group: "B",
      required: true,
      label: buy ? "Giá 5m đang tại vùng Bò của H1 hoặc H4" : "Giá 5m đang tại vùng Gấu của H1 hoặc H4",
      pass: false,
      note: "Chưa có nến 5 phút vào vùng khung lớn",
    },
    {
      id: "b2",
      group: "B",
      required: true,
      label: "Vùng lấy từ H1 hoặc H4, không phải vùng giữa",
      pass: false,
    },
    {
      id: "b3",
      group: "B",
      required: true,
      label: "Vùng khung lớn chưa bị phá vỡ rõ",
      pass: !htf.broken,
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
      pass: frameZones(pack).length > 0,
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
