import { i as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as SYMBOLS, t as INTERVAL_LABEL } from "./constants-BtHadw-g.mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { d as formatPrice, f as formatUsd, i as usePaper, n as useSettings, o as positionSize, r as paperEquity, u as formatPct } from "./router-CM6PRVh4.mjs";
import { n as cn, t as Button } from "./button-dpyY1ZN3.mjs";
import { a as useMarket, i as tickerOf, n as currentBias, r as overlayOf, t as bestLive } from "./market-M5kH7E49.mjs";
import { a as placeLive, i as geoBlocked, n as fetchSnapshot, r as fetchTickers, t as Switch } from "./live-0wDMfRGG.mjs";
import { n as Root2, r as Trigger, t as List } from "../_libs/radix-ui__react-tabs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Bx5Hp27Z.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Badge({ className, tone = "neutral", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums", tone === "neutral" && "bg-raised text-muted", tone === "bull" && "bg-bull-dim text-bull", tone === "bear" && "bg-bear-dim text-bear", tone === "warn" && "bg-raised text-warn", className),
		...props
	});
}
var Tabs = Root2;
function TabsList({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
		className: cn("inline-flex h-10 items-center gap-1 rounded-md bg-raised p-1", className),
		...props
	});
}
function TabsTrigger({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
		className: cn("inline-flex h-8 items-center justify-center rounded-sm px-3 text-xs font-medium text-muted transition-colors duration-150 data-[state=active]:bg-surface data-[state=active]:text-fg", className),
		...props
	});
}
function useScanner() {
	const symbol = useSettings((s) => s.symbol);
	const autoPaper = useSettings((s) => s.autoPaper);
	const riskPct = useSettings((s) => s.riskPct);
	const applySnapshot = useMarket((s) => s.applySnapshot);
	const applyTickers = useMarket((s) => s.applyTickers);
	const setLoading = useMarket((s) => s.setLoading);
	const setError = useMarket((s) => s.setError);
	const lastAuto = (0, import_react.useRef)("");
	const focus = useQuery({
		queryKey: ["snapshot-focus", symbol],
		queryFn: () => fetchSnapshot({ data: {
			symbols: [symbol],
			focus: symbol,
			intervals: [
				"5m",
				"15m",
				"1h",
				"4h"
			],
			limit: 180
		} }),
		refetchInterval: 2e4
	});
	const full = useQuery({
		queryKey: ["snapshot-full", symbol],
		queryFn: () => fetchSnapshot({ data: {
			symbols: SYMBOLS.map((x) => x.id),
			focus: symbol,
			intervals: [
				"5m",
				"15m",
				"1h",
				"4h"
			],
			limit: 180
		} }),
		refetchInterval: 4e4
	});
	const tickers = useQuery({
		queryKey: ["tickers"],
		queryFn: () => fetchTickers({ data: { symbols: SYMBOLS.map((x) => x.id) } }),
		refetchInterval: 3e3
	});
	(0, import_react.useEffect)(() => {
		setLoading(focus.isFetching && !focus.data && !full.data);
	}, [
		focus.isFetching,
		focus.data,
		full.data,
		setLoading
	]);
	(0, import_react.useEffect)(() => {
		const snap = full.data ?? focus.data;
		if (snap) {
			applySnapshot({
				...snap,
				focus: symbol
			});
			setError(null);
		} else if (focus.error) setError(focus.error instanceof Error ? focus.error.message : "Không tải được thị trường");
	}, [
		full.data,
		focus.data,
		focus.error,
		symbol,
		applySnapshot,
		setError
	]);
	(0, import_react.useEffect)(() => {
		if (tickers.data) applyTickers(tickers.data);
	}, [tickers.data, applyTickers]);
	(0, import_react.useEffect)(() => {
		const t = useMarket.getState().tickers;
		if (t.length) usePaper.getState().tick(t);
	}, [tickers.data]);
	(0, import_react.useEffect)(() => {
		if (!autoPaper || !(full.data ?? focus.data)) return;
		const { signals, filters } = useMarket.getState();
		const live = bestLive(signals);
		if (!live) return;
		if (lastAuto.current === live.id) return;
		const paper = usePaper.getState();
		if (Date.now() < paper.haltUntil) return;
		const equity = paperEquity(paper.cash, paper.positions, useMarket.getState().tickers);
		const settings = useSettings.getState();
		if (paper.placeFromSignal(live, {
			equity,
			riskPct: settings.riskPct,
			step: filters.step,
			mode: "paper"
		})) {
			lastAuto.current = live.id;
			toast.success(`Paper ${live.side === "BUY" ? "MUA" : "BÁN"} ${live.symbol} · ${live.setupName}`);
		}
	}, [
		autoPaper,
		full.data,
		focus.data,
		riskPct,
		symbol
	]);
}
function PositionsBar() {
	const positions = usePaper((s) => s.positions);
	const tickers = useMarket((s) => s.tickers);
	const close = usePaper((s) => s.close);
	const haltUntil = usePaper((s) => s.haltUntil);
	const halted = Date.now() < haltUntil;
	if (!positions.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-lg bg-raised px-4 py-3 text-sm text-muted",
		children: halted ? "Đã halt sau 3 lệnh thua trong ngày — đứng ngoài, review rule." : "Chưa có vị thế. Đợi setup đủ A+B+C+D+F rồi vào."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full text-left text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
				className: "text-xs text-faint",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "py-2 pr-4 font-medium",
						children: "Cặp"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "pr-4 font-medium",
						children: "Hướng"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "pr-4 font-medium",
						children: "Vào"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "pr-4 font-medium",
						children: "SL"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "pr-4 font-medium",
						children: "TP1"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "pr-4 font-medium",
						children: "PnL"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "font-medium" })
				] })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: positions.map((p) => {
				const px = tickerOf(tickers, p.symbol)?.price ?? p.entry;
				const dir = p.side === "BUY" ? 1 : -1;
				const u = (px - p.entry) * dir * p.remainingQty + p.realizedPnl;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-t border-line",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "py-3 pr-4",
							children: [p.symbol, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-faint",
								children: p.setupName
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: p.side === "BUY" ? "pr-4 text-bull" : "pr-4 text-bear",
							children: p.side === "BUY" ? "MUA" : "BÁN"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "pr-4 font-mono tabular-nums",
							children: formatPrice(p.entry)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "pr-4 font-mono tabular-nums",
							children: formatPrice(p.sl)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "pr-4 font-mono tabular-nums",
							children: formatPrice(p.tp1)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: cn("pr-4 font-mono tabular-nums", u >= 0 ? "text-bull" : "text-bear"),
							children: formatUsd(u)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => close(p.id, px, "Đóng tay"),
							children: "Đóng"
						}) })
					]
				}, p.id);
			}) })]
		})
	});
}
var BULL = "#3d9a6a";
var BEAR = "#c45c5c";
var EMA9 = "#d8d4cc";
var EMA21 = "#8a8c90";
var VWAP = "#b8956a";
function PriceChart({ candles, signal }) {
	const host = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const el = host.current;
		if (!el || candles.length < 2) return;
		let disposed = false;
		let chart = null;
		(async () => {
			const lc = await import("../_libs/lightweight-charts.mjs").then((n) => n.t);
			if (disposed || !host.current) return;
			const node = host.current;
			const created = lc.createChart(node, {
				width: node.clientWidth,
				height: node.clientHeight,
				layout: {
					background: { color: "#151619" },
					textColor: "#8a8c90",
					fontFamily: "IBM Plex Sans, sans-serif"
				},
				grid: {
					vertLines: { color: "#2a2c30" },
					horzLines: { color: "#2a2c30" }
				},
				rightPriceScale: { borderColor: "#2a2c30" },
				timeScale: {
					borderColor: "#2a2c30",
					timeVisible: true,
					secondsVisible: false
				},
				crosshair: {
					vertLine: { color: "#5c5e62" },
					horzLine: { color: "#5c5e62" }
				}
			});
			chart = created;
			const series = created.addSeries(lc.CandlestickSeries, {
				upColor: BULL,
				downColor: BEAR,
				borderUpColor: BULL,
				borderDownColor: BEAR,
				wickUpColor: BULL,
				wickDownColor: BEAR
			});
			series.setData(candles.map((c) => ({
				time: Math.floor(c.t / 1e3),
				open: c.o,
				high: c.h,
				low: c.l,
				close: c.c
			})));
			const overlay = overlayOf(candles);
			const line = (color, values, width = 1) => {
				created.addSeries(lc.LineSeries, {
					color,
					lineWidth: width,
					priceLineVisible: false,
					lastValueVisible: false,
					crosshairMarkerVisible: false
				}).setData(candles.flatMap((c, i) => {
					const v = values[i];
					if (v == null) return [];
					return [{
						time: Math.floor(c.t / 1e3),
						value: v
					}];
				}));
			};
			line(EMA9, overlay.ema9, 1);
			line(EMA21, overlay.ema21, 2);
			line(VWAP, overlay.vwap, 1);
			const addZone = (z) => {
				series.createPriceLine({
					price: z.kind === "bull" ? z.lo : z.hi,
					color: z.kind === "bull" ? BULL : BEAR,
					lineWidth: 1,
					lineStyle: lc.LineStyle.Dashed,
					axisLabelVisible: true,
					title: z.label
				});
			};
			overlay.zones.slice(0, 2).forEach(addZone);
			if (signal) {
				series.createPriceLine({
					price: signal.entry,
					color: EMA9,
					lineWidth: 1,
					lineStyle: lc.LineStyle.Solid,
					title: "Entry",
					axisLabelVisible: true
				});
				series.createPriceLine({
					price: signal.sl,
					color: BEAR,
					lineWidth: 1,
					lineStyle: lc.LineStyle.SparseDotted,
					title: "SL",
					axisLabelVisible: true
				});
				series.createPriceLine({
					price: signal.tp1,
					color: BULL,
					lineWidth: 1,
					lineStyle: lc.LineStyle.SparseDotted,
					title: "TP1",
					axisLabelVisible: true
				});
			}
			created.timeScale().fitContent();
		})();
		const ro = new ResizeObserver(() => {
			if (!chart || !host.current) return;
			chart.applyOptions({
				width: host.current.clientWidth,
				height: host.current.clientHeight
			});
		});
		ro.observe(el);
		return () => {
			disposed = true;
			ro.disconnect();
			chart?.remove();
		};
	}, [candles, signal]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: host,
		className: "h-full w-full"
	});
}
function SignalPanel() {
	const signals = useMarket((s) => s.signals);
	const live = signals.find((s) => s.requiredPass) ?? signals[0] ?? null;
	if (!live) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg bg-raised p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-lg",
			children: "Đứng ngoài"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-muted",
			children: "Không có setup đủ điều kiện. Hệ thống sống nhờ chọn lọc, không sống nhờ số lượng lệnh."
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignalCard, {
		signal: live,
		others: signals.filter((s) => s.id !== live.id)
	});
}
function SignalCard({ signal, others }) {
	const filters = useMarket((s) => s.filters);
	const tickers = useMarket((s) => s.tickers);
	const settings = useSettings();
	const paper = usePaper();
	const equity = paperEquity(paper.cash, paper.positions, tickers);
	const size = positionSize({
		equity,
		riskPct: settings.riskPct,
		entry: signal.entry,
		sl: signal.sl,
		step: filters.step
	});
	const buy = signal.side === "BUY";
	async function enterPaper() {
		if (!paper.placeFromSignal(signal, {
			equity,
			riskPct: settings.riskPct,
			step: filters.step,
			mode: "paper"
		})) {
			toast.error("Không vào được — đang halt, trùng vị thế, hoặc thiếu size.");
			return;
		}
		toast.success(`Đã vào lệnh giấy ${buy ? "MUA" : "BÁN"} ${signal.symbol}`);
	}
	async function enterLive() {
		if (!settings.liveArmed || !settings.apiKey || !settings.apiSecret) {
			toast.error("Bật Live và nhập API key trong Cài đặt trước.");
			return;
		}
		try {
			const res = await placeLive({
				apiKey: settings.apiKey,
				apiSecret: settings.apiSecret,
				testnet: settings.testnet,
				signal,
				equity,
				riskPct: settings.riskPct,
				step: filters.step,
				leverage: settings.maxLeverage
			});
			if (!res.order.ok) {
				if (geoBlocked(res.order.status, res.order.body)) toast.error("Binance chặn khu vực máy chủ. Dùng lệnh giấy, hoặc testnet.");
				else toast.error(`Lệnh live thất bại (${res.order.status})`);
				return;
			}
			paper.placeFromSignal(signal, {
				equity,
				riskPct: settings.riskPct,
				step: filters.step,
				mode: "live"
			});
			toast.success("Đã gửi lệnh Binance Futures + SL/TP.");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Lỗi live order");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg bg-raised p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs tracking-wide text-muted uppercase",
							children: "Setup"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl",
							children: signal.setupName
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: signal.requiredPass ? buy ? "bull" : "bear" : "warn",
							children: signal.requiredPass ? "ĐƯỢC VÀO" : "THEO DÕI"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: buy ? "bull" : "bear",
								children: buy ? "MUA" : "BÁN"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: signal.strategy.toUpperCase() }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, { children: ["Q ", Math.round(signal.quality)] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-4 grid grid-cols-2 gap-3 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								k: "Vào",
								v: formatPrice(signal.entry)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								k: "SL",
								v: formatPrice(signal.sl)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								k: "TP1 1.5R",
								v: formatPrice(signal.tp1)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								k: "TP2 2.5R",
								v: formatPrice(signal.tp2)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								k: "R:R",
								v: signal.rr.toFixed(2)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								k: "Size",
								v: `${size.qty || "—"} · ${formatUsd(size.notional, 0)}`
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-xs text-muted",
						children: [
							"Risk ",
							settings.riskPct,
							"% = ",
							formatUsd(size.riskUsd),
							" · đòn bẩy cần ~",
							size.leverageNeeded.toFixed(1),
							"x"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-3 space-y-1 text-sm text-muted",
						children: [signal.reasons.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["· ", r] }, r)), signal.rejects.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "text-warn",
							children: ["· ", r]
						}, r))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: buy ? "bull" : "bear",
							onClick: () => void enterPaper(),
							disabled: !signal.requiredPass,
							children: "Vào lệnh giấy"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: () => void enterLive(),
							disabled: !signal.requiredPass,
							children: "Gửi Binance"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checklist, { signal }),
			others.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg bg-raised p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-2 text-xs text-muted",
					children: "Setup khác trên cặp này"
				}), others.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between py-1 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: s.setupName }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: s.side === "BUY" ? "text-bull" : "text-bear",
						children: ["Q", Math.round(s.quality)]
					})]
				}, s.id))]
			}) : null
		]
	});
}
function Stat({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
		className: "text-xs text-faint",
		children: k
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
		className: "font-mono tabular-nums",
		children: v
	})] });
}
function Checklist({ signal }) {
	const groups = [
		"A",
		"B",
		"C",
		"D",
		"E",
		"F"
	];
	const titles = {
		A: "Hướng",
		B: "Vùng",
		C: "Hành vi",
		D: "Vào / SL / TP",
		E: "Bộ lọc phụ",
		F: "Tâm lý"
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg bg-raised p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-3 text-xs tracking-wide text-muted uppercase",
			children: "Checklist Luật Bò Gấu"
		}), groups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 last:mb-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mb-1 text-xs font-medium text-fg",
				children: [
					g,
					". ",
					titles[g]
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-1",
				children: signal.checklist.filter((i) => i.group === g).map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-start gap-2 text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("mt-0.5 font-mono", i.pass ? "text-bull" : "text-bear"),
						children: i.pass ? "[x]" : "[ ]"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: i.pass ? "text-muted" : "text-fg",
						children: [
							i.label,
							i.required ? "" : " (phụ)",
							i.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-faint",
								children: [" — ", i.note]
							}) : null
						]
					})]
				}, i.id))
			})]
		}, g))]
	});
}
function Watchlist() {
	const symbol = useSettings((s) => s.symbol);
	const setSymbol = useSettings((s) => s.setSymbol);
	const tickers = useMarket((s) => s.tickers);
	const hits = useMarket((s) => s.watchHits);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-col gap-1",
		children: SYMBOLS.map((s) => {
			const t = tickerOf(tickers, s.id);
			const hit = hits.find((h) => h.symbol === s.id);
			const active = symbol === s.id;
			const up = (t?.changePct ?? 0) >= 0;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setSymbol(s.id),
				className: cn("flex min-h-11 items-center justify-between rounded-md px-3 py-2 text-left transition-colors duration-150", active ? "bg-raised" : "hover:bg-raised/60"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-medium",
						children: s.label
					}), hit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("text-xs", hit.side === "BUY" ? "text-bull" : "text-bear"),
						children: hit.requiredPass ? "Setup" : "Theo dõi"
					}) : null]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs text-faint",
					children: s.name
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-right",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-mono text-sm tabular-nums",
						children: t ? formatPrice(t.price) : "—"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cn("font-mono text-xs tabular-nums", up ? "text-bull" : "text-bear"),
						children: t ? formatPct(t.changePct) : ""
					})]
				})]
			}, s.id);
		})
	});
}
function Desk() {
	useScanner();
	const symbol = useSettings((s) => s.symbol);
	const chartTf = useSettings((s) => s.chartTf);
	const setChartTf = useSettings((s) => s.setChartTf);
	const autoPaper = useSettings((s) => s.autoPaper);
	const liveArmed = useSettings((s) => s.liveArmed);
	const patch = useSettings((s) => s.patch);
	const books = useMarket((s) => s.books);
	const tickers = useMarket((s) => s.tickers);
	const signals = useMarket((s) => s.signals);
	const loading = useMarket((s) => s.loading);
	const error = useMarket((s) => s.error);
	const replaySummary = useMarket((s) => s.replaySummary);
	const cash = usePaper((s) => s.cash);
	const positions = usePaper((s) => s.positions);
	const startEquity = usePaper((s) => s.startEquity);
	const close = usePaper((s) => s.close);
	const ticker = tickerOf(tickers, symbol);
	const candles = books[symbol]?.[chartTf] ?? [];
	const bias = currentBias(books, symbol);
	const live = signals.find((s) => s.requiredPass) ?? null;
	const equity = paperEquity(cash, positions, tickers);
	const daily = equity - startEquity;
	const up = (ticker?.changePct ?? 0) >= 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-baseline gap-x-3 gap-y-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "font-display text-3xl",
									children: symbol.replace("USDT", "")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-2xl tabular-nums",
									children: ticker ? formatPrice(ticker.price) : "—"
								}),
								ticker ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("font-mono text-sm tabular-nums", up ? "text-bull" : "text-bear"),
									children: formatPct(ticker.changePct)
								}) : null
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: bias?.note ?? "Đang đọc cấu trúc…"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex shrink-0 flex-wrap items-center gap-4 sm:flex-col sm:items-end",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: liveArmed ? "bear" : "neutral",
								children: liveArmed ? "LIVE" : "PAPER"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "sm:text-right",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-faint",
										children: "Tài khoản giấy"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-mono tabular-nums",
										children: formatUsd(equity)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: cn("font-mono text-xs tabular-nums", daily >= 0 ? "text-bull" : "text-bear"),
										children: [formatUsd(daily), " hôm nay"]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex min-h-11 items-center gap-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: autoPaper,
									onCheckedChange: (v) => patch({ autoPaper: v })
								}), "Auto paper"]
							})
						]
					})]
				})
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-lg border border-line bg-raised px-4 py-3 text-sm text-warn",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)_20rem]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
						className: "rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-2 px-1 text-xs tracking-wide text-muted uppercase",
								children: "Watchlist"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Watchlist, {}),
							replaySummary ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 rounded-md bg-raised p-3 text-xs text-muted",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mb-1 text-fg",
										children: "Replay rule"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
										replaySummary.done,
										" lệnh · thắng ",
										replaySummary.wins,
										" · WR ",
										replaySummary.wr.toFixed(0),
										"%"
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
										"Kỳ vọng ",
										replaySummary.expectancy.toFixed(2),
										"R / lệnh"
									] })
								]
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-2 flex flex-wrap items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tabs, {
								value: chartTf,
								onValueChange: (v) => setChartTf(v),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsList, { children: [
									"5m",
									"15m",
									"1h",
									"4h"
								].map((tf) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: tf,
									children: INTERVAL_LABEL[tf]
								}, tf)) })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3 text-xs text-muted",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-fg",
										children: "EMA9"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "EMA21" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-warn",
										children: "VWAP"
									})
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-80 overflow-hidden rounded-md bg-raised lg:h-96",
							children: loading && candles.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-full items-center justify-center text-sm text-muted",
								children: "Đang kéo nến Binance…"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PriceChart, {
								candles,
								signal: live
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignalPanel, {}) })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: "Vị thế"
					}), positions.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "outline",
						onClick: () => {
							const px = ticker?.price;
							positions.forEach((p) => {
								const price = tickerOf(tickers, p.symbol)?.price ?? px ?? p.entry;
								close(p.id, price, "Đóng hết");
							});
						},
						children: "Đóng hết"
					}) : null]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PositionsBar, {})]
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, {});
}
//#endregion
export { Home as component };
