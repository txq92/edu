import { signedCall } from "./sign";
import type { SignedResult } from "./api";
import type { Signal } from "@/lib/nukida/types";
import { positionSize, roundStep } from "@/lib/nukida/risk";

export async function testConnection(apiKey: string, apiSecret: string, testnet: boolean): Promise<SignedResult> {
  return signedCall({
    apiKey,
    apiSecret,
    testnet,
    method: "GET",
    path: "/fapi/v2/account",
  });
}

export async function placeLive(opts: {
  apiKey: string;
  apiSecret: string;
  testnet: boolean;
  signal: Signal;
  equity: number;
  riskPct: number;
  step: number;
  leverage: number;
  marginUsd?: number;
  sizeBy?: "risk" | "margin";
}): Promise<{ order: SignedResult; sl: SignedResult | null; tp: SignedResult | null; qty: number }> {
  const size = positionSize({
    equity: opts.equity,
    riskPct: opts.riskPct,
    entry: opts.signal.entry,
    sl: opts.signal.sl,
    step: opts.step,
    leverage: opts.leverage,
    marginUsd: opts.marginUsd,
    sizeBy: opts.sizeBy,
  });
  if (size.qty <= 0) throw new Error("Khối lượng không hợp lệ");

  await signedCall({
    apiKey: opts.apiKey,
    apiSecret: opts.apiSecret,
    testnet: opts.testnet,
    method: "POST",
    path: "/fapi/v1/leverage",
    params: { symbol: opts.signal.symbol, leverage: Math.max(1, Math.min(Math.round(opts.leverage), 125)) },
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
      newOrderRespType: "RESULT",
    },
  });
  if (!order.ok) return { order, sl: null, tp: null, qty: size.qty };

  const closeSide = opts.signal.side === "BUY" ? "SELL" : "BUY";
  const sl = await signedCall({
    apiKey: opts.apiKey,
    apiSecret: opts.apiSecret,
    testnet: opts.testnet,
    method: "POST",
    path: "/fapi/v1/order",
    params: {
      symbol: opts.signal.symbol,
      side: closeSide,
      type: "STOP_MARKET",
      stopPrice: roundStep(opts.signal.sl, 0.01),
      closePosition: "true",
      workingType: "MARK_PRICE",
    },
  });
  const tp = await signedCall({
    apiKey: opts.apiKey,
    apiSecret: opts.apiSecret,
    testnet: opts.testnet,
    method: "POST",
    path: "/fapi/v1/order",
    params: {
      symbol: opts.signal.symbol,
      side: closeSide,
      type: "TAKE_PROFIT_MARKET",
      stopPrice: roundStep(opts.signal.tp1, 0.01),
      closePosition: "true",
      workingType: "MARK_PRICE",
    },
  });
  return { order, sl, tp, qty: size.qty };
}

export function geoBlocked(status: number, body: string): boolean {
  return status === 451 || body.includes("restricted location") || body.includes("eligibility");
}
