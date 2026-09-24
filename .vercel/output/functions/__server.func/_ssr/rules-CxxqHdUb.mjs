import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/rules-CxxqHdUb.js
var import_jsx_runtime = require_jsx_runtime();
var BLOCKS = [
	{
		title: "Nguyên tắc cốt lõi",
		items: [
			"Ưu tiên cấu trúc trước điểm vào. Nến đẹp giữa nowhere = đứng ngoài.",
			"Trade theo phe đang thắng, không bắt đỉnh/đáy cảm tính.",
			"Ít lệnh, chất lượng cao. Không có setup sạch thì không vào.",
			"Luôn có Stop Loss. R:R tối thiểu 1:1.5.",
			"Khung lớn quyết định hướng, khung nhỏ quyết định điểm vào."
		]
	},
	{
		title: "Ba lớp vào lệnh",
		items: [
			"Breakout + retest: phá hộp 15m kèm lực, chờ 5m retest mép hộp. Không đuổi nến phá đầu tiên.",
			"Pullback EMA 9/21: 15m EMA9 xếp trên/dưới EMA21, hồi về EMA21, 5m đảo chiều giữ EMA.",
			"VWAP phiên: chỉ long trên VWAP, chỉ short dưới VWAP. Hồi chạm rồi giữ. Tránh giờ funding.",
			"Hội tụ: 15m EMA + VWAP cùng hướng, vùng trùng nhau, 5m nến giữ — xác suất sạch hơn."
		]
	},
	{
		title: "Vùng Bò Gấu",
		items: [
			"Vùng Bò: đáy cấu trúc hoặc nơi phe mua từng đẩy mạnh — càng gần khung xương càng mạnh.",
			"Vùng Gấu: đỉnh cấu trúc hoặc nơi phe bán từng đạp mạnh.",
			"Loại vùng giữa trend, vùng xuyên nhiều lần, vùng nhỏ ngược sóng mẹ."
		]
	},
	{
		title: "Quản lý vốn",
		items: [
			"Risk 0.5–1% tài khoản mỗi lệnh. Đòn bẩy chỉ để đạt notional, không phải lý do tăng risk.",
			"Không dời SL xa hơn khi đang lỗ. Không trung bình giá khi sai.",
			"2–3 lệnh thua đúng rule: halt trong ngày, review, không gỡ gạc.",
			"Đi được 1R: chốt 50%, dời SL hòa vốn."
		]
	},
	{
		title: "6 câu hỏi 20 giây",
		items: [
			"Khung lớn có ủng hộ hướng này không?",
			"Có đang đứng tại vùng Bò Gấu chất lượng không?",
			"Nến/lực có cho thấy phe mình bắt đầu thắng không?",
			"SL có chỗ đặt hợp lý không?",
			"R:R có đạt tối thiểu 1.5 không?",
			"Mình có đang FOMO hoặc gỡ lỗ không?"
		]
	}
];
function RulesPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl",
				children: "Luật Bò Gấu"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-muted",
				children: "Tài liệu học tập theo hệ thống Nukida. Không phải lời khuyên đầu tư. Trading có rủi ro mất vốn."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 flex flex-col gap-4",
				children: BLOCKS.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl",
						children: b.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-2 text-sm text-muted",
						children: b.items.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "pl-1",
							children: it
						}, it))
					})]
				}, b.title))
			})
		]
	});
}
//#endregion
export { RulesPage as component };
