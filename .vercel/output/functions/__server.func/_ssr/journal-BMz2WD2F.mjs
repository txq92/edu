import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { d as formatPrice, f as formatUsd, i as usePaper } from "./router-CM6PRVh4.mjs";
import { n as cn, t as Button } from "./button-dpyY1ZN3.mjs";
import { a as useMarket, i as tickerOf } from "./market-M5kH7E49.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/journal-BMz2WD2F.js
var import_jsx_runtime = require_jsx_runtime();
function JournalPage() {
	const history = usePaper((s) => s.history);
	const positions = usePaper((s) => s.positions);
	const tickers = useMarket((s) => s.tickers);
	function exportText() {
		const text = [...positions, ...history].map((p) => {
			const j = p.journal;
			return `Ngày: ${j.date}
Sản phẩm: ${j.product}
Hướng: ${j.side === "BUY" ? "MUA" : "BÁN"}
Khung xương: ${j.skeletonTf}
Khung vào lệnh: ${j.entryTf}
Xu hướng khung lớn: ${j.htfTrend}
Vùng Bò Gấu: ${j.zone}
Tín hiệu nến / lực: ${j.candleForce}
Lý do vào: ${j.reason}
Điểm vào: ${j.entry}
SL: ${j.sl}
TP1: ${j.tp1}
TP2: ${j.tp2}
R:R: ${j.rr}
Risk %: ${j.riskPct}
Có đủ checklist bắt buộc không? ${j.checklistOk ? "Có" : "Không"}
Kết quả: ${j.result ?? "đang chạy"}
Đúng rule hay sai rule: ${j.ruleOk === void 0 ? "" : j.ruleOk ? "Đúng rule" : "Sai rule"}
Bài học: ${j.lesson ?? ""}
---`;
		}).join("\n\n");
		navigator.clipboard.writeText(text || "Chưa có lệnh.");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6 flex items-end justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl",
				children: "Nhật ký"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-muted",
				children: "Mỗi lệnh ghi plan trước khi bấm — review rule, không chỉ lãi lỗ."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				onClick: exportText,
				children: "Copy mẫu"
			})]
		}), !history.length && !positions.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "rounded-xl bg-surface p-6 text-sm text-muted shadow-[var(--shadow-border)]",
			children: "Chưa có lệnh. Khi vào từ Desk, plan được ghi tự động theo mẫu Nukida."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-col gap-3",
			children: [...positions, ...history].map((p) => {
				const px = tickerOf(tickers, p.symbol)?.price ?? p.entry;
				const dir = p.side === "BUY" ? 1 : -1;
				const u = p.status === "closed" ? p.realizedPnl : (px - p.entry) * dir * p.remainingQty + p.realizedPnl;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "font-display text-xl",
								children: [
									p.symbol,
									" · ",
									p.side === "BUY" ? "MUA" : "BÁN"
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("font-mono tabular-nums", u >= 0 ? "text-bull" : "text-bear"),
								children: formatUsd(u)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: p.setupName
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-xs text-faint",
									children: "Vào"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "font-mono",
									children: formatPrice(p.entry)
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-xs text-faint",
									children: "SL"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "font-mono",
									children: formatPrice(p.sl)
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-xs text-faint",
									children: "TP1"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "font-mono",
									children: formatPrice(p.tp1)
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-xs text-faint",
									children: "R:R"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "font-mono",
									children: p.rr.toFixed(2)
								})] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-xs text-muted",
							children: p.journal.candleForce
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-faint",
							children: [
								"Checklist ",
								p.journal.checklistOk ? "đủ" : "thiếu",
								" · ",
								p.journal.result ?? p.status,
								" · ",
								p.mode
							]
						})
					]
				}, p.id);
			})
		})]
	});
}
//#endregion
export { JournalPage as component };
