import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cloudCreate, cloudEnter, cloudPull, cloudPush, cloudStatus } from "@/lib/cloud/api";
import { readBook, usePaper, writeBook } from "@/lib/store/paper";
import { useSession } from "@/lib/store/session";

let pauseSave = false;

export function CloudGate({ children }: { children: ReactNode }) {
  const token = useSession((s) => s.token);
  const setToken = useSession((s) => s.setToken);
  const [mode, setMode] = useState<"loading" | "setup" | "login" | "in">("loading");
  const [booted, setBooted] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("meo-den-token");
    if (stored) setToken(stored);
    setBooted(true);
  }, [setToken]);

  useEffect(() => {
    if (!booted) return;
    let cancel = false;
    void (async () => {
      await usePaper.persist.rehydrate();
      try {
        const status = await cloudStatus({ data: {} });
        if (cancel) return;
        if (!status.ready) {
          setMode("setup");
          return;
        }
        if (!token) {
          setMode("login");
          return;
        }
        const remote = await cloudPull({ data: { token } });
        if (cancel) return;
        if (remote.updatedAt > 0) {
          pauseSave = true;
          writeBook(remote.paper);
          pauseSave = false;
        } else {
          await cloudPush({ data: { token, paper: readBook() } });
        }
        setMode("in");
      } catch {
        if (cancel) return;
        setToken(null);
        setMode("login");
      }
    })();
    return () => {
      cancel = true;
    };
  }, [booted, token, setToken]);

  useEffect(() => {
    if (mode !== "in" || !token) return;
    let timer = 0;
    const unsub = usePaper.subscribe(() => {
      if (pauseSave) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const paper = readBook();
        void cloudPush({ data: { token, paper } }).catch(() => {
          toast.error("Không ghi được sổ JSON trên server.");
        });
      }, 500);
    });
    return () => {
      unsub();
      window.clearTimeout(timer);
    };
  }, [mode, token]);

  async function submit(kind: "setup" | "login") {
    setBusy(true);
    try {
      const res =
        kind === "setup"
          ? await cloudCreate({ data: { password } })
          : await cloudEnter({ data: { password } });
      if (kind === "login" && res.updatedAt > 0) {
        pauseSave = true;
        writeBook(res.paper);
        pauseSave = false;
      } else {
        await cloudPush({ data: { token: res.token, paper: readBook() } });
      }
      setToken(res.token);
      setPassword("");
      setMode("in");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không vào được sổ.";
      if (msg.includes("Đã có mật khẩu")) setMode("login");
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  if (mode === "in" && token) return children;
  if (mode === "loading") {
    return <p className="px-4 py-16 text-center text-sm text-muted">Đang mở sổ lệnh…</p>;
  }

  const setup = mode === "setup";
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <h1 className="font-display text-4xl">{setup ? "Tạo sổ" : "Vào sổ"}</h1>
      <p className="mt-2 text-sm text-muted">
        {setup
          ? "Một mật khẩu cho đúng một người. Sổ lệnh lưu dạng JSON dùng chung, trình duyệt nào đăng nhập cũng thấy."
          : "Nhập mật khẩu đã tạo. Lịch sử lệnh và thống kê dùng chung."}
      </p>
      <form
        className="mt-6 grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(setup ? "setup" : "login");
        }}
      >
        <Input
          type="password"
          autoComplete={setup ? "new-password" : "current-password"}
          value={password}
          placeholder="Mật khẩu"
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" disabled={busy || password.trim().length < 4}>
          {busy ? "Đang lưu…" : setup ? "Tạo và vào" : "Đăng nhập"}
        </Button>
      </form>
    </div>
  );
}
