export const SYMBOLS = [
  { id: "BTCUSDT", label: "BTC", name: "Bitcoin" },
  { id: "ETHUSDT", label: "ETH", name: "Ethereum" },
  { id: "SOLUSDT", label: "SOL", name: "Solana" },
  { id: "BNBUSDT", label: "BNB", name: "BNB" },
  { id: "XRPUSDT", label: "XRP", name: "XRP" },
  { id: "DOGEUSDT", label: "DOGE", name: "Dogecoin" },
  { id: "ADAUSDT", label: "ADA", name: "Cardano" },
  { id: "AVAXUSDT", label: "AVAX", name: "Avalanche" },
  { id: "LINKUSDT", label: "LINK", name: "Chainlink" },
  { id: "TRXUSDT", label: "TRX", name: "TRON" },
  { id: "LTCUSDT", label: "LTC", name: "Litecoin" },
  { id: "DOTUSDT", label: "DOT", name: "Polkadot" },
  { id: "UNIUSDT", label: "UNI", name: "Uniswap" },
  { id: "NEARUSDT", label: "NEAR", name: "NEAR" },
  { id: "APTUSDT", label: "APT", name: "Aptos" },
  { id: "SUIUSDT", label: "SUI", name: "Sui" },
  { id: "TONUSDT", label: "TON", name: "Toncoin" },
  { id: "FILUSDT", label: "FIL", name: "Filecoin" },
  { id: "AAVEUSDT", label: "AAVE", name: "Aave" },
  { id: "PAXGUSDT", label: "PAXG", name: "Vàng (PAXG)" },
] as const;

export type SymbolId = string;

export const DEFAULT_WATCH = SYMBOLS.map((s) => s.id);

export const MAX_WATCH = 20;

const DEFAULT_IDS = new Set<string>(DEFAULT_WATCH);

export function isDefaultSymbol(id: string) {
  return DEFAULT_IDS.has(id);
}

export function symbolMeta(id: string) {
  const known = SYMBOLS.find((s) => s.id === id);
  if (known) return known;
  const label = id.replace(/USDT$/, "");
  return { id, label, name: label };
}

/** "doge", "DOGE/USDT", "1000PEPE" → "DOGEUSDT". Null nếu không phải mã hợp lệ. */
export function normalizeSymbol(raw: string): string | null {
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!cleaned) return null;
  const id = cleaned.endsWith("USDT") ? cleaned : `${cleaned}USDT`;
  if (!/^[A-Z0-9]{2,15}USDT$/.test(id) || id === "USDT") return null;
  return id;
}

export const INTERVALS = ["3m", "5m", "15m", "1h", "4h"] as const;
export type Interval = (typeof INTERVALS)[number];

export const INTERVAL_LABEL: Record<string, string> = {
  "3m": "M3",
  "5m": "M5",
  "15m": "M15",
  "1h": "H1",
  "4h": "H4",
};

export const LIVE_PATHS = new Set([
  "/fapi/v1/account",
  "/fapi/v1/balance",
  "/fapi/v1/positionRisk",
  "/fapi/v1/openOrders",
  "/fapi/v1/order",
  "/fapi/v1/leverage",
  "/fapi/v1/time",
  "/fapi/v2/account",
  "/fapi/v2/balance",
  "/fapi/v2/positionRisk",
]);

export const LIVE_HOSTS = {
  prod: "https://fapi.binance.com",
  testnet: "https://testnet.binancefuture.com",
} as const;
