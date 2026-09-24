import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { n as LIVE_HOSTS, r as LIVE_PATHS } from "./constants-BtHadw-g.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-DbbOwQ-M.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var fetchSnapshot_createServerFn_handler = createServerRpc({
	id: "a275aa213860c26c1ddfec694cd5234507b594012c8e50614c006f98aad6edf1",
	name: "fetchSnapshot",
	filename: "src/lib/binance/api.ts"
}, (opts) => fetchSnapshot.__executeServer(opts));
var fetchSnapshot = createServerFn({ method: "POST" }).validator((d) => {
	const x = d;
	if (!x?.focus || !Array.isArray(x.symbols) || !Array.isArray(x.intervals)) throw new Error("snapshot input invalid");
	return {
		symbols: x.symbols.slice(0, 8),
		focus: x.focus,
		intervals: x.intervals.slice(0, 6),
		limit: Math.min(x.limit ?? 200, 500)
	};
}).handler(fetchSnapshot_createServerFn_handler, async ({ data }) => {
	const { getSnapshot } = await import("./market.server-iZkChh-y.mjs");
	return getSnapshot(data);
});
var fetchTickers_createServerFn_handler = createServerRpc({
	id: "fe032c2d0c12723c9be307d353834b2af33d5c3c959ea8f041ca0d886b2b4aa4",
	name: "fetchTickers",
	filename: "src/lib/binance/api.ts"
}, (opts) => fetchTickers.__executeServer(opts));
var fetchTickers = createServerFn({ method: "POST" }).validator((d) => {
	const x = d;
	if (!Array.isArray(x?.symbols)) throw new Error("symbols required");
	return { symbols: x.symbols.slice(0, 8) };
}).handler(fetchTickers_createServerFn_handler, async ({ data }) => {
	const { getTickers } = await import("./market.server-iZkChh-y.mjs");
	return getTickers(data.symbols);
});
var proxySigned_createServerFn_handler = createServerRpc({
	id: "ecc6bc1b3788804a07c6bb1061c3e5fb90208550ce2d93428c8ea447076f78ba",
	name: "proxySigned",
	filename: "src/lib/binance/api.ts"
}, (opts) => proxySigned.__executeServer(opts));
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
}).handler(proxySigned_createServerFn_handler, async ({ data }) => {
	const host = data.testnet ? LIVE_HOSTS.testnet : LIVE_HOSTS.prod;
	const q = data.query ? `${data.query}&signature=${data.signature}` : `signature=${data.signature}`;
	const url = `${host}${data.path}?${q}`;
	const res = await fetch(url, {
		method: data.method,
		headers: {
			"X-MBX-APIKEY": data.apiKey,
			Accept: "application/json"
		}
	});
	const body = await res.text();
	return {
		ok: res.ok,
		status: res.status,
		body
	};
});
//#endregion
export { fetchSnapshot_createServerFn_handler, fetchTickers_createServerFn_handler, proxySigned_createServerFn_handler };
