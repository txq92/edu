import { proxySigned, type SignedResult } from "./api";

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function signedCall(opts: {
  apiKey: string;
  apiSecret: string;
  testnet: boolean;
  method: "GET" | "POST" | "DELETE";
  path: string;
  params?: Record<string, string | number | boolean | undefined>;
}): Promise<SignedResult> {
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(opts.params ?? {})) {
    if (v === undefined) continue;
    params[k] = String(v);
  }
  params.timestamp = String(Date.now());
  params.recvWindow = "5000";
  const query = new URLSearchParams(params).toString();
  const signature = await hmacSha256Hex(opts.apiSecret, query);
  return proxySigned({
    data: {
      testnet: opts.testnet,
      method: opts.method,
      path: opts.path,
      query,
      signature,
      apiKey: opts.apiKey,
    },
  });
}
