import { createServerFn } from "@tanstack/react-start";

function tokenOf(raw: unknown) {
  const token = String((raw as { token?: string })?.token ?? "").trim();
  if (!/^\d+:[A-Za-z0-9_-]{20,}$/.test(token)) throw new Error("Token bot không đúng dạng.");
  return token;
}

async function tg(token: string, method: string, body?: Record<string, string>) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json()) as { ok?: boolean; description?: string; result?: unknown };
  if (!json.ok) throw new Error(json.description || "Telegram từ chối.");
  return json.result;
}

export const telegramFindChat = createServerFn({ method: "POST" })
  .validator((d: unknown) => ({ token: tokenOf(d) }))
  .handler(async ({ data }) => {
    const result = (await tg(data.token, "getUpdates")) as Array<{
      message?: { chat?: { id?: number; title?: string; username?: string } };
    }>;
    const chat = [...result].reverse().find((u) => u.message?.chat?.id)?.message?.chat;
    if (!chat?.id) throw new Error("Chưa thấy chat. Mở bot, gửi /start, rồi bấm lại.");
    return { chatId: String(chat.id), title: chat.title || chat.username || String(chat.id) };
  });

export const telegramSend = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const token = tokenOf(d);
    const chatId = String((d as { chatId?: string })?.chatId ?? "").trim();
    const text = String((d as { text?: string })?.text ?? "").trim().slice(0, 3500);
    if (!chatId) throw new Error("Thiếu chat id.");
    if (!text) throw new Error("Thiếu nội dung.");
    return { token, chatId, text };
  })
  .handler(async ({ data }) => {
    await tg(data.token, "sendMessage", { chat_id: data.chatId, text: data.text });
    return { ok: true as const };
  });
