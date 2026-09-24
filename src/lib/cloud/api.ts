import { createServerFn } from "@tanstack/react-start";
import type { PaperBook } from "./types";

function passwordOf(d: unknown) {
  const password = (d as { password?: string })?.password?.trim() ?? "";
  if (password.length < 4) throw new Error("Mật khẩu tối thiểu 4 ký tự.");
  return password;
}

function tokenOf(d: unknown) {
  const token = (d as { token?: string })?.token ?? "";
  if (!token) throw new Error("Thiếu phiên đăng nhập.");
  return token;
}

export const cloudStatus = createServerFn({ method: "POST" })
  .validator(() => ({}))
  .handler(async () => {
    const { cloudReady } = await import("./book.server");
    return cloudReady();
  });

export const cloudCreate = createServerFn({ method: "POST" })
  .validator((d: unknown) => ({ password: passwordOf(d) }))
  .handler(async ({ data }) => {
    const { cloudSetup } = await import("./book.server");
    return cloudSetup(data.password);
  });

export const cloudEnter = createServerFn({ method: "POST" })
  .validator((d: unknown) => ({ password: passwordOf(d) }))
  .handler(async ({ data }) => {
    const { cloudLogin } = await import("./book.server");
    return cloudLogin(data.password);
  });

export const cloudPull = createServerFn({ method: "POST" })
  .validator((d: unknown) => ({ token: tokenOf(d) }))
  .handler(async ({ data }) => {
    const { cloudLoad } = await import("./book.server");
    return cloudLoad(data.token);
  });

export const cloudPush = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const token = tokenOf(d);
    const paper = (d as { paper?: PaperBook }).paper;
    if (!paper) throw new Error("Thiếu sổ lệnh.");
    return { token, paper };
  })
  .handler(async ({ data }) => {
    const { cloudSave } = await import("./book.server");
    return cloudSave(data.token, data.paper);
  });
