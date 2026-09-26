import { createServerFn } from "@tanstack/react-start";
import { LIVE_HOSTS, LIVE_PATHS } from "./constants";

export type SignedResult = {
  ok: boolean;
  status: number;
  body: string;
};

export const fetchSnapshot = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const x = d as { symbols?: string[]; focus?: string; intervals?: string[]; limit?: number };
    if (!x?.focus || !Array.isArray(x.symbols) || !Array.isArray(x.intervals)) {
      throw new Error("snapshot input invalid");
    }
    return {
      symbols: x.symbols.slice(0, 20),
      focus: x.focus,
      intervals: x.intervals.slice(0, 8),
      limit: Math.min(x.limit ?? 200, 500),
    };
  })
  .handler(async ({ data }) => {
    const { getSnapshot } = await import("./market.server");
    return getSnapshot(data);
  });

export const fetchHistory = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const x = d as { symbol?: string; days?: number };
    if (!x?.symbol) throw new Error("symbol required");
    return { symbol: x.symbol, days: Math.min(30, Math.max(1, Math.round(x.days ?? 7))) };
  })
  .handler(async ({ data }) => {
    const { getHistory } = await import("./market.server");
    return getHistory(data.symbol, data.days);
  });

export const fetchTickers = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const x = d as { symbols?: string[] };
    if (!Array.isArray(x?.symbols)) throw new Error("symbols required");
    return { symbols: x.symbols.slice(0, 20) };
  })
  .handler(async ({ data }) => {
    const { getTickers } = await import("./market.server");
    return getTickers(data.symbols);
  });

export const proxySigned = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const x = d as {
      testnet?: boolean;
      method?: string;
      path?: string;
      query?: string;
      signature?: string;
      apiKey?: string;
    };
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
      apiKey: x.apiKey,
    };
  })
  .handler(async ({ data }) => {
    const host = data.testnet ? LIVE_HOSTS.testnet : LIVE_HOSTS.prod;
    const q = data.query ? `${data.query}&signature=${data.signature}` : `signature=${data.signature}`;
    const url = `${host}${data.path}?${q}`;
    const res = await fetch(url, {
      method: data.method,
      headers: {
        "X-MBX-APIKEY": data.apiKey,
        Accept: "application/json",
      },
    });
    const body = await res.text();
    const result: SignedResult = { ok: res.ok, status: res.status, body };
    return result;
  });
