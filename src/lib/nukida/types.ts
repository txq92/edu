export type Side = "BUY" | "SELL";
export type Trend = "up" | "down" | "side";
export type StrategyId = "breakout" | "ema" | "vwap" | "confluence" | "zone" | "force";
export type TradeMode = "paper" | "live";

export type Candle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  closed: boolean;
};

export type Zone = {
  lo: number;
  hi: number;
  kind: "bull" | "bear";
  quality: number;
  label: string;
};

export type Swing = {
  t: number;
  price: number;
  kind: "high" | "low";
  index: number;
};

export type Structure = {
  trend: Trend;
  swings: Swing[];
  lastHh?: number;
  lastHl?: number;
  lastLh?: number;
  lastLl?: number;
  broken: boolean;
  note: string;
};

export type ChecklistItem = {
  id: string;
  group: "A" | "B" | "C" | "D" | "E" | "F";
  required: boolean;
  label: string;
  pass: boolean;
  note?: string;
};

export type Signal = {
  id: string;
  symbol: string;
  side: Side;
  strategy: StrategyId;
  setupName: string;
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  rr: number;
  slPct: number;
  bias: Trend;
  zone: Zone;
  checklist: ChecklistItem[];
  requiredPass: boolean;
  quality: number;
  reasons: string[];
  rejects: string[];
  at: number;
  barTime: number;
  status: "live" | "watch" | "historical";
};

export type ReplayResult = {
  signal: Signal;
  outcome: "tp1" | "tp2" | "sl" | "open";
  mfeR: number;
  maeR: number;
};

export type Ticker = {
  symbol: string;
  price: number;
  changePct: number;
  high: number;
  low: number;
  volume: number;
};

export type Position = {
  id: string;
  symbol: string;
  side: Side;
  strategy: StrategyId;
  setupName: string;
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  qty: number;
  remainingQty: number;
  notional: number;
  marginUsd?: number;
  leverage?: number;
  riskUsd: number;
  riskPct: number;
  rr: number;
  status: "open" | "partial" | "closed";
  openedAt: number;
  closedAt?: number;
  tp1At?: number;
  tp2At?: number;
  slAt?: number;
  realizedPnl: number;
  mode: TradeMode;
  slMovedToBe: boolean;
  journal: JournalEntry;
};

export type JournalEntry = {
  date: string;
  product: string;
  side: Side;
  skeletonTf: string;
  entryTf: string;
  htfTrend: string;
  zone: string;
  candleForce: string;
  reason: string;
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  rr: number;
  riskPct: number;
  checklistOk: boolean;
  result?: string;
  ruleOk?: boolean;
  lesson?: string;
};

export type AccountSnapshot = {
  equity: number;
  available: number;
  dailyPnl: number;
  openRiskUsd: number;
};
