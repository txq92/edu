import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getSql } from "@/lib/db";
import type { PaperBook } from "./types";

const scrypt = promisify(scryptCb);
const ROW = "solo";

type FileShape = {
  salt: string;
  passwordHash: string;
  tokens: string[];
  updatedAt: number;
  paper: PaperBook;
};

const emptyPaper = (): PaperBook => ({
  cash: 1000,
  startEquity: 1000,
  positions: [],
  history: [],
  haltUntil: 0,
  lossesToday: 0,
  lastLossDay: "",
});

let chain: Promise<unknown> = Promise.resolve();

function lock<T>(job: () => Promise<T>): Promise<T> {
  const run = chain.then(job, job);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readShape(): Promise<FileShape | null> {
  const sql = await getSql();
  const rows = await sql.query<{ doc: FileShape | string }>("select doc from player_book where id = $1", [ROW]);
  const doc = rows[0]?.doc;
  if (!doc) return null;
  const data = typeof doc === "string" ? (JSON.parse(doc) as FileShape) : doc;
  if (!data?.passwordHash || !data.salt) return null;
  return {
    salt: data.salt,
    passwordHash: data.passwordHash,
    tokens: Array.isArray(data.tokens) ? data.tokens.slice(0, 8) : [],
    updatedAt: Number(data.updatedAt) || 0,
    paper: normalizeBook(data.paper),
  };
}

async function writeShape(data: FileShape) {
  const sql = await getSql();
  await sql.query(
    `insert into player_book (id, doc) values ($1, $2::jsonb)
     on conflict (id) do update set doc = excluded.doc`,
    [ROW, JSON.stringify(data)],
  );
}

export function cloudReady() {
  return lock(async () => ({ ready: (await readShape()) != null }));
}

export function cloudSetup(password: string) {
  return lock(async () => {
    if (await readShape()) throw new Error("Đã có mật khẩu.");
    const salt = randomBytes(16).toString("hex");
    const passwordHash = (await scrypt(password, salt, 32)) as Buffer;
    const token = randomBytes(24).toString("hex");
    const paper = emptyPaper();
    await writeShape({
      salt,
      passwordHash: passwordHash.toString("hex"),
      tokens: [token],
      updatedAt: 0,
      paper,
    });
    return { token, paper, updatedAt: 0 };
  });
}

export function cloudLogin(password: string) {
  return lock(async () => {
    const file = await readShape();
    if (!file) throw new Error("Chưa tạo mật khẩu.");
    const hash = (await scrypt(password, file.salt, 32)) as Buffer;
    const expected = Buffer.from(file.passwordHash, "hex");
    if (hash.length !== expected.length || !timingSafeEqual(hash, expected)) {
      throw new Error("Sai mật khẩu.");
    }
    const token = randomBytes(24).toString("hex");
    file.tokens = [token, ...file.tokens].slice(0, 8);
    await writeShape(file);
    return { token, paper: file.paper, updatedAt: file.updatedAt };
  });
}

export function cloudLoad(token: string) {
  return lock(async () => {
    const file = await requireToken(token);
    return { paper: file.paper, updatedAt: file.updatedAt };
  });
}

export function cloudSave(token: string, paper: PaperBook) {
  return lock(async () => {
    const file = await requireToken(token);
    file.paper = normalizeBook(paper);
    file.updatedAt = Date.now();
    await writeShape(file);
    return { updatedAt: file.updatedAt };
  });
}

async function requireToken(token: string) {
  const file = await readShape();
  if (!file || !file.tokens.includes(token)) throw new Error("Phiên đăng nhập hết hạn.");
  return file;
}

function normalizeBook(input: Partial<PaperBook> | undefined): PaperBook {
  const base = emptyPaper();
  if (!input || typeof input !== "object") return base;
  return {
    cash: num(input.cash, base.cash),
    startEquity: num(input.startEquity, base.startEquity),
    positions: Array.isArray(input.positions) ? input.positions.slice(0, 50) : [],
    history: Array.isArray(input.history) ? input.history.slice(0, 200) : [],
    haltUntil: num(input.haltUntil, 0),
    lossesToday: num(input.lossesToday, 0),
    lastLossDay: typeof input.lastLossDay === "string" ? input.lastLossDay : "",
  };
}

function num(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
