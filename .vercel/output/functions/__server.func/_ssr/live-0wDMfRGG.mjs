import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { r as LIVE_PATHS } from "./constants-BtHadw-g.mjs";
import { o as positionSize, s as roundStep } from "./router-CM6PRVh4.mjs";
import { n as cn } from "./button-dpyY1ZN3.mjs";
import { n as SwitchThumb, t as Switch$1 } from "../_libs/@radix-ui/react-switch+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/live-0wDMfRGG.js
var import_jsx_runtime = require_jsx_runtime();
function Switch({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch$1, {
		className: cn("peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-line bg-raised transition-colors duration-150 data-[state=checked]:bg-accent", className),
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: "block size-5 translate-x-0.5 rounded-full bg-fg transition-transform duration-150 data-[state=checked]:translate-x-5 data-[state=checked]:bg-accent-fg" })
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var fetchSnapshot = createServerFn({ method: "POST" }).validator((d) => {
	const x = d;
	if (!x?.focus || !Array.isArray(x.symbols) || !Array.isArray(x.intervals)) throw new Error("snapshot input invalid");
	return {
		symbols: x.symbols.slice(0, 8),
		focus: x.focus,
		intervals: x.intervals.slice(0, 6),
		limit: Math.min(x.limit ?? 200, 500)
	};
}).handler(createSsrRpc("a275aa213860c26c1ddfec694cd5234507b594012c8e50614c006f98aad6edf1"));
var fetchTickers = createServerFn({ method: "POST" }).validator((d) => {
	const x = d;
	if (!Array.isArray(x?.symbols)) throw new Error("symbols required");
	return { symbols: x.symbols.slice(0, 8) };
}).handler(createSsrRpc("fe032c2d0c12723c9be307d353834b2af33d5c3c959ea8f041ca0d886b2b4aa4"));
var proxySigned = createServerFn({ method: "POST" }).validator((d) => {
	const x = d;
	if (!x?.path || !x.apiKey || !x.signature) throw new Error("signed request incomplete");
	if (!LIVE_PATHS.has(x.path)) throw new Error("path not allowed");
	const method = (x.method ?? "GET").toUpperCase();
	if (method !== "GET" && method !== "POST" && method !== "DELETE") throw new Error("method not allowed");
	return {
		testnet: Boolean(x.testnet),
		method,
		path: x.path,
		query: x.query ?? "",
		signature: x.signature,
		apiKey: x.apiKey
	};
}).handler(createSsrRpc("ecc6bc1b3788804a07c6bb1061c3e5fb90208550ce2d93428c8ea447076f78ba"));
async function hmacSha256Hex(secret, message) {
	const enc = new TextEncoder();
	const key = await crypto.subtle.importKey("raw", enc.encode(secret), {
		name: "HMAC",
		hash: "SHA-256"
	}, false, ["sign"]);
	const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
	return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function signedCall(opts) {
	const params = {};
	for (const [k, v] of Object.entries(opts.params ?? {})) {
		if (v === void 0) continue;
		params[k] = String(v);
	}
	params.timestamp = String(Date.now());
	params.recvWindow = "5000";
	const query = new URLSearchParams(params).toString();
	const signature = await hmacSha256Hex(opts.apiSecret, query);
	return proxySigned({ data: {
		testnet: opts.testnet,
		method: opts.method,
		path: opts.path,
		query,
		signature,
		apiKey: opts.apiKey
	} });
}
async function testConnection(apiKey, apiSecret, testnet) {
	return signedCall({
		apiKey,
		apiSecret,
		testnet,
		method: "GET",
		path: "/fapi/v2/account"
	});
}
async function placeLive(opts) {
	const size = positionSize({
		equity: opts.equity,
		riskPct: opts.riskPct,
		entry: opts.signal.entry,
		sl: opts.signal.sl,
		step: opts.step
	});
	if (size.qty <= 0) throw new Error("Khối lượng không hợp lệ");
	await signedCall({
		apiKey: opts.apiKey,
		apiSecret: opts.apiSecret,
		testnet: opts.testnet,
		method: "POST",
		path: "/fapi/v1/leverage",
		params: {
			symbol: opts.signal.symbol,
			leverage: Math.max(1, Math.min(opts.leverage, 20))
		}
	});
	const order = await signedCall({
		apiKey: opts.apiKey,
		apiSecret: opts.apiSecret,
		testnet: opts.testnet,
		method: "POST",
		path: "/fapi/v1/order",
		params: {
			symbol: opts.signal.symbol,
			side: opts.signal.side,
			type: "MARKET",
			quantity: size.qty,
			newOrderRespType: "RESULT"
		}
	});
	if (!order.ok) return {
		order,
		sl: null,
		tp: null,
		qty: size.qty
	};
	const closeSide = opts.signal.side === "BUY" ? "SELL" : "BUY";
	return {
		order,
		sl: await signedCall({
			apiKey: opts.apiKey,
			apiSecret: opts.apiSecret,
			testnet: opts.testnet,
			method: "POST",
			path: "/fapi/v1/order",
			params: {
				symbol: opts.signal.symbol,
				side: closeSide,
				type: "STOP_MARKET",
				stopPrice: roundStep(opts.signal.sl, .01),
				closePosition: "true",
				workingType: "MARK_PRICE"
			}
		}),
		tp: await signedCall({
			apiKey: opts.apiKey,
			apiSecret: opts.apiSecret,
			testnet: opts.testnet,
			method: "POST",
			path: "/fapi/v1/order",
			params: {
				symbol: opts.signal.symbol,
				side: closeSide,
				type: "TAKE_PROFIT_MARKET",
				stopPrice: roundStep(opts.signal.tp1, .01),
				closePosition: "true",
				workingType: "MARK_PRICE"
			}
		}),
		qty: size.qty
	};
}
function geoBlocked(status, body) {
	return status === 451 || body.includes("restricted location") || body.includes("eligibility");
}
//#endregion
export { placeLive as a, geoBlocked as i, fetchSnapshot as n, testConnection as o, fetchTickers as r, Switch as t };
