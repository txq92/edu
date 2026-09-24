import { i as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { _ as Link, f as createRouter, g as createRootRoute, h as createFileRoute, l as Scripts, m as lazyRouteComponent, p as Outlet, u as HeadContent, v as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as SYMBOLS } from "./constants-BtHadw-g.mjs";
import { a as BookOpen, i as LayoutGrid, n as Settings, r as ScrollText, t as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
import { n as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-CM6PRVh4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
function formatPrice(price, digits) {
	const d = digits ?? priceDigits(price);
	return price.toLocaleString("en-US", {
		minimumFractionDigits: d,
		maximumFractionDigits: d
	});
}
function priceDigits(price) {
	if (price >= 1e3) return 2;
	if (price >= 100) return 3;
	if (price >= 1) return 4;
	return 6;
}
function formatUsd(n, digits = 2) {
	return `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString("en-US", {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	})}`;
}
function formatPct(n, digits = 2) {
	return `${n > 0 ? "+" : ""}${n.toFixed(digits)}%`;
}
function todayKey(ts = Date.now()) {
	return new Date(ts).toISOString().slice(0, 10);
}
function positionSize(opts) {
	const riskUsd = opts.equity * (opts.riskPct / 100);
	const slPct = Math.abs(opts.entry - opts.sl) / opts.entry;
	if (slPct <= 0 || !Number.isFinite(slPct)) return {
		qty: 0,
		notional: 0,
		riskUsd,
		slPct: 0,
		leverageNeeded: 0
	};
	const notional = riskUsd / slPct;
	let qty = notional / opts.entry;
	const step = opts.step ?? .001;
	qty = roundStep(qty, step);
	const lev = opts.equity > 0 ? notional / opts.equity : 0;
	return {
		qty,
		notional: qty * opts.entry,
		riskUsd,
		slPct,
		leverageNeeded: lev
	};
}
function roundStep(value, step) {
	if (step <= 0) return value;
	const n = Math.floor(value / step + 1e-12) * step;
	const decimals = decimalsOf(step);
	return Number(n.toFixed(decimals));
}
function decimalsOf(step) {
	const s = step.toString();
	if (s.includes("e-")) return Number(s.split("e-")[1]);
	const i = s.indexOf(".");
	return i === -1 ? 0 : s.length - i - 1;
}
function targets(entry, sl, side, r1 = 1.5, r2 = 2.5) {
	const risk = Math.abs(entry - sl);
	if (side === "BUY") return {
		tp1: entry + risk * r1,
		tp2: entry + risk * r2
	};
	return {
		tp1: entry - risk * r1,
		tp2: entry - risk * r2
	};
}
function rrOf(entry, sl, tp) {
	const risk = Math.abs(entry - sl);
	if (risk <= 0) return 0;
	return Math.abs(tp - entry) / risk;
}
function paddedSl(entry, structureSl, side, atrVal) {
	const buffer = Math.max(atrVal * .25, entry * 6e-4);
	if (side === "BUY") return Math.min(structureSl, entry) - buffer;
	return Math.max(structureSl, entry) + buffer;
}
function journalFrom(signal, riskPct) {
	return {
		date: new Date(signal.at).toLocaleString("vi-VN"),
		product: signal.symbol,
		side: signal.side,
		skeletonTf: "H4 / H1",
		entryTf: "M15 bias / M5 vào",
		htfTrend: signal.bias,
		zone: `${signal.zone.label} ${signal.zone.lo.toFixed(2)}–${signal.zone.hi.toFixed(2)}`,
		candleForce: signal.reasons.join("; "),
		reason: signal.setupName,
		entry: signal.entry,
		sl: signal.sl,
		tp1: signal.tp1,
		tp2: signal.tp2,
		rr: signal.rr,
		riskPct,
		checklistOk: signal.requiredPass
	};
}
function pnlAt(pos, price) {
	const dir = pos.side === "BUY" ? 1 : -1;
	return (price - pos.entry) * dir * pos.remainingQty;
}
var usePaper = create()(persist((set, get) => ({
	cash: 1e3,
	startEquity: 1e3,
	positions: [],
	history: [],
	haltUntil: 0,
	lossesToday: 0,
	lastLossDay: "",
	placeFromSignal: (signal, opts) => {
		const state = get();
		if (Date.now() < state.haltUntil) return null;
		if (state.positions.some((p) => p.symbol === signal.symbol && p.status !== "closed")) return null;
		const size = positionSize({
			equity: opts.equity,
			riskPct: opts.riskPct,
			entry: signal.entry,
			sl: signal.sl,
			step: opts.step ?? .001
		});
		if (size.qty <= 0) return null;
		const pos = {
			id: `${signal.symbol}-${signal.at}`,
			symbol: signal.symbol,
			side: signal.side,
			strategy: signal.strategy,
			setupName: signal.setupName,
			entry: signal.entry,
			sl: signal.sl,
			tp1: signal.tp1,
			tp2: signal.tp2,
			qty: size.qty,
			remainingQty: size.qty,
			notional: size.notional,
			riskUsd: size.riskUsd,
			riskPct: opts.riskPct,
			rr: signal.rr,
			status: "open",
			openedAt: Date.now(),
			realizedPnl: 0,
			mode: opts.mode ?? "paper",
			slMovedToBe: false,
			journal: journalFrom(signal, opts.riskPct)
		};
		set({ positions: [...state.positions, pos] });
		return pos;
	},
	tick: (tickers) => {
		const map = new Map(tickers.map((t) => [t.symbol, t.price]));
		const day = todayKey();
		let lossesToday = get().lastLossDay === day ? get().lossesToday : 0;
		const still = [];
		const closed = [];
		for (const pos of get().positions) {
			const price = map.get(pos.symbol);
			if (price == null) {
				still.push(pos);
				continue;
			}
			let next = { ...pos };
			const dir = pos.side === "BUY" ? 1 : -1;
			const hitSl = pos.side === "BUY" ? price <= next.sl : price >= next.sl;
			const hitTp2 = pos.side === "BUY" ? price >= next.tp2 : price <= next.tp2;
			const hitTp1 = pos.side === "BUY" ? price >= next.tp1 : price <= next.tp1;
			if (hitSl) {
				const pnl = (next.sl - next.entry) * dir * next.remainingQty;
				next = {
					...next,
					remainingQty: 0,
					status: "closed",
					closedAt: Date.now(),
					realizedPnl: next.realizedPnl + pnl,
					journal: {
						...next.journal,
						result: `SL ${pnl.toFixed(2)}`,
						ruleOk: true
					}
				};
				closed.push(next);
				if (pnl < 0) lossesToday += 1;
				continue;
			}
			if (hitTp2) {
				const pnl = (next.tp2 - next.entry) * dir * next.remainingQty;
				next = {
					...next,
					remainingQty: 0,
					status: "closed",
					closedAt: Date.now(),
					realizedPnl: next.realizedPnl + pnl,
					journal: {
						...next.journal,
						result: `TP2 ${pnl.toFixed(2)}`,
						ruleOk: true
					}
				};
				closed.push(next);
				continue;
			}
			if (hitTp1 && next.status === "open") {
				const half = next.remainingQty / 2;
				const pnl = (next.tp1 - next.entry) * dir * half;
				next = {
					...next,
					remainingQty: next.remainingQty - half,
					status: "partial",
					realizedPnl: next.realizedPnl + pnl,
					sl: next.entry,
					slMovedToBe: true,
					journal: {
						...next.journal,
						result: `TP1 50% ${pnl.toFixed(2)}`
					}
				};
			}
			still.push(next);
		}
		const haltUntil = lossesToday >= 3 ? Date.now() + 432e5 : get().haltUntil;
		const realized = closed.reduce((a, p) => a + p.realizedPnl, 0);
		set({
			positions: still,
			history: [...closed, ...get().history].slice(0, 200),
			cash: get().cash + realized,
			lossesToday,
			lastLossDay: day,
			haltUntil
		});
	},
	close: (id, price, reason) => {
		const pos = get().positions.find((p) => p.id === id);
		if (!pos) return;
		const pnl = pnlAt(pos, price);
		const done = {
			...pos,
			remainingQty: 0,
			status: "closed",
			closedAt: Date.now(),
			realizedPnl: pos.realizedPnl + pnl,
			journal: {
				...pos.journal,
				result: `${reason} ${pnl.toFixed(2)}`,
				ruleOk: true
			}
		};
		set({
			positions: get().positions.filter((p) => p.id !== id),
			history: [done, ...get().history].slice(0, 200),
			cash: get().cash + pnl
		});
	},
	reset: (equity) => set({
		cash: equity,
		startEquity: equity,
		positions: [],
		history: [],
		haltUntil: 0,
		lossesToday: 0
	})
}), {
	name: "nukida-paper",
	skipHydration: true
}));
function paperEquity(cash, positions, tickers) {
	const map = new Map(tickers.map((t) => [t.symbol, t.price]));
	return cash + positions.reduce((acc, p) => {
		return acc + pnlAt(p, map.get(p.symbol) ?? p.entry);
	}, 0);
}
var useSettings = create()(persist((set) => ({
	symbol: SYMBOLS[0].id,
	chartTf: "15m",
	equity: 1e3,
	riskPct: 1,
	minRr: 1.5,
	maxLeverage: 10,
	autoPaper: false,
	autoLive: false,
	liveArmed: false,
	testnet: false,
	apiKey: "",
	apiSecret: "",
	consecutiveLossHalt: 3,
	setSymbol: (symbol) => set({ symbol }),
	setChartTf: (chartTf) => set({ chartTf }),
	patch: (p) => set(p)
}), {
	name: "nukida-settings",
	skipHydration: true
}));
function AppProviders({ children }) {
	const [client] = (0, import_react.useState)(() => new QueryClient({ defaultOptions: { queries: {
		refetchOnWindowFocus: false,
		retry: 1,
		staleTime: 4e3
	} } }));
	(0, import_react.useEffect)(() => {
		useSettings.persist.rehydrate();
		usePaper.persist.rehydrate();
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
			theme: "dark",
			position: "top-center"
		})]
	});
}
var NAV = [
	{
		to: "/",
		label: "Desk",
		icon: LayoutGrid
	},
	{
		to: "/journal",
		label: "Nhật ký",
		icon: ScrollText
	},
	{
		to: "/rules",
		label: "Luật",
		icon: BookOpen
	},
	{
		to: "/settings",
		label: "Cài đặt",
		icon: Settings
	}
];
function Shell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-30 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-screen-2xl items-center justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "flex items-baseline gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-xl",
							children: "Nukida Desk"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden text-xs tracking-wide text-muted sm:inline",
							children: "Luật Bò Gấu"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "hidden items-center gap-1 md:flex",
						children: NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: item.to,
							className: "rounded-sm px-3 py-2 text-sm text-muted transition-colors duration-150 hover:bg-raised hover:text-fg data-[status=active]:bg-raised data-[status=active]:text-fg",
							children: item.label
						}, item.to))
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "mx-auto w-full max-w-screen-2xl flex-1 px-3 py-4 pb-20 md:px-4 md:pb-6",
				children
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-bg/95 md:hidden",
				children: NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: item.to,
					className: "flex min-h-14 flex-col items-center justify-center gap-1 text-faint data-[status=active]:text-fg",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs",
						children: item.label
					})]
				}, item.to))
			})
		]
	});
}
var styles_default = "/assets/styles-D8qvAqEx.css";
var APP_NAME = "Nukida Desk";
var Route$4 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "theme-color",
				content: "#0c0d0f"
			},
			{
				name: "description",
				content: "Terminal giao dịch Luật Bò Gấu — breakout, EMA, VWAP, kết nối Binance Futures."
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "vi",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppProviders, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
var $$splitComponentImporter$3 = () => import("./routes-Bx5Hp27Z.mjs");
var Route$3 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./journal-BMz2WD2F.mjs");
var Route$2 = createFileRoute("/journal")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./rules-CxxqHdUb.mjs");
var Route$1 = createFileRoute("/rules")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./settings-CG2nTXUb.mjs");
var Route = createFileRoute("/settings")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var rootRouteChildren = {
	IndexRoute: Route$3.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$4
	}),
	JournalRoute: Route$2.update({
		id: "/journal",
		path: "/journal",
		getParentRoute: () => Route$4
	}),
	RulesRoute: Route$1.update({
		id: "/rules",
		path: "/rules",
		getParentRoute: () => Route$4
	}),
	SettingsRoute: Route.update({
		id: "/settings",
		path: "/settings",
		getParentRoute: () => Route$4
	})
};
var routeTree = Route$4._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { paddedSl as a, rrOf as c, formatPrice as d, formatUsd as f, usePaper as i, targets as l, useSettings as n, positionSize as o, paperEquity as r, roundStep as s, router_exports as t, formatPct as u };
