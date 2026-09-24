//#region node_modules/.nitro/vite/services/ssr/assets/constants-BtHadw-g.js
var SYMBOLS = [
	{
		id: "BTCUSDT",
		label: "BTC",
		name: "Bitcoin"
	},
	{
		id: "ETHUSDT",
		label: "ETH",
		name: "Ethereum"
	},
	{
		id: "SOLUSDT",
		label: "SOL",
		name: "Solana"
	},
	{
		id: "BNBUSDT",
		label: "BNB",
		name: "BNB"
	},
	{
		id: "XRPUSDT",
		label: "XRP",
		name: "XRP"
	},
	{
		id: "PAXGUSDT",
		label: "PAXG",
		name: "Vàng (PAXG)"
	}
];
var INTERVAL_LABEL = {
	"5m": "M5",
	"15m": "M15",
	"1h": "H1",
	"4h": "H4"
};
var LIVE_PATHS = /* @__PURE__ */ new Set([
	"/fapi/v1/account",
	"/fapi/v1/balance",
	"/fapi/v1/positionRisk",
	"/fapi/v1/openOrders",
	"/fapi/v1/order",
	"/fapi/v1/leverage",
	"/fapi/v1/time",
	"/fapi/v2/account",
	"/fapi/v2/balance",
	"/fapi/v2/positionRisk"
]);
var LIVE_HOSTS = {
	prod: "https://fapi.binance.com",
	testnet: "https://testnet.binancefuture.com"
};
//#endregion
export { SYMBOLS as i, LIVE_HOSTS as n, LIVE_PATHS as r, INTERVAL_LABEL as t };
