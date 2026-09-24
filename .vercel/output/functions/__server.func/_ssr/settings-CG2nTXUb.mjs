import { i as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as usePaper, n as useSettings } from "./router-CM6PRVh4.mjs";
import { n as cn, t as Button } from "./button-dpyY1ZN3.mjs";
import { i as geoBlocked, o as testConnection, t as Switch } from "./live-0wDMfRGG.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-CG2nTXUb.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn("flex h-10 w-full rounded-sm border border-line bg-raised px-3 text-sm text-fg outline-none transition-[box-shadow] duration-150 placeholder:text-faint focus-visible:ring-2 focus-visible:ring-ring/40", className),
		...props
	});
}
function Label({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: cn("text-xs font-medium text-muted", className),
		...props
	});
}
function SettingsPage() {
	const s = useSettings();
	const reset = usePaper((p) => p.reset);
	const [confirm, setConfirm] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function ping() {
		if (!s.apiKey || !s.apiSecret) {
			toast.error("Nhập API key và secret trước.");
			return;
		}
		setBusy(true);
		try {
			const res = await testConnection(s.apiKey, s.apiSecret, s.testnet);
			if (!res.ok) {
				if (geoBlocked(res.status, res.body)) toast.error("Binance chặn khu vực máy chủ. Testnet hoặc lệnh giấy vẫn dùng được.");
				else toast.error(`Kết nối thất bại (${res.status}). Kiểm tra quyền Futures.`);
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
		toast.success("Live đã bật. Risk vẫn 1%/lệnh — không tăng lot.");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl",
				children: "Cài đặt"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Key chỉ lưu trên máy này (trình duyệt). Secret được ký HMAC tại client, máy chủ chỉ chuyển tiếp request đã ký."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: "Rủi ro"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Vốn giấy (USDT)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								min: 50,
								value: s.equity,
								onChange: (e) => s.patch({ equity: Number(e.target.value) || 0 })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Risk mỗi lệnh (%)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								min: .1,
								max: 1,
								step: .1,
								value: s.riskPct,
								onChange: (e) => s.patch({ riskPct: Math.min(1, Math.max(.1, Number(e.target.value) || 1)) })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Đòn bẩy tối đa (live)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								min: 1,
								max: 20,
								value: s.maxLeverage,
								onChange: (e) => s.patch({ maxLeverage: Number(e.target.value) || 10 })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							onClick: () => {
								reset(s.equity);
								toast.success("Đã reset tài khoản giấy.");
							},
							children: [
								"Reset tài khoản giấy về ",
								s.equity,
								" USDT"
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl",
						children: "Binance Futures"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted",
						children: "Tạo API chỉ Futures, không rút tiền. Mặc định paper — live phải gõ LIVE."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "API Key",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: s.apiKey,
									onChange: (e) => s.patch({ apiKey: e.target.value.trim() }),
									autoComplete: "off"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "API Secret",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "password",
									value: s.apiSecret,
									onChange: (e) => s.patch({ apiSecret: e.target.value.trim() }),
									autoComplete: "off"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex min-h-11 items-center justify-between gap-3 text-sm",
								children: ["Testnet", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: s.testnet,
									onCheckedChange: (v) => s.patch({ testnet: v })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex min-h-11 items-center justify-between gap-3 text-sm",
								children: ["Auto paper khi đủ checklist", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: s.autoPaper,
									onCheckedChange: (v) => s.patch({ autoPaper: v })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								onClick: () => void ping(),
								disabled: busy,
								children: busy ? "Đang thử…" : "Thử kết nối"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: "Live"
				}), s.liveArmed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-bear",
						children: "Live đang bật. Nút Gửi Binance sẽ đặt MARKET + SL/TP."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => s.patch({
							liveArmed: false,
							autoLive: false
						}),
						children: "Tắt live"
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Gõ LIVE để bật",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: confirm,
							onChange: (e) => setConfirm(e.target.value),
							placeholder: "LIVE"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "bear",
						onClick: armLive,
						children: "Bật giao dịch thật"
					})]
				})]
			})
		]
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), children]
	});
}
//#endregion
export { SettingsPage as component };
