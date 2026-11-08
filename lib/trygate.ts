// Public "try it free" caps for the hosted app. Off unless UMLESS_PUBLIC_TRY=1, so self-hosters are unaffected.
// Every limit is enforced here, server side, before a job is created:
//   file size, allowed modes, email required, N clips per email per day, N clips per IP per day,
//   a burst limit per IP, a global daily job cap, concurrent jobs, and a daily OpenRouter spend guard.
// The 10-minute duration cap (MAX_FREE_SEC) and the 24-hour file deletion live in lib/jobs.ts.
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const num = (v: string | undefined, d: number) => (v && Number.isFinite(Number(v)) ? Number(v) : d);

export const publicTry = () => process.env.UMLESS_PUBLIC_TRY === "1";
export const tryLimits = () => ({
  maxBytes: num(process.env.UMLESS_TRY_MAX_MB, 200) * 1024 * 1024,
  perEmailPerDay: num(process.env.UMLESS_TRY_PER_EMAIL, 1),
  perIpPerDay: num(process.env.UMLESS_TRY_PER_IP, 3),
  globalPerDay: num(process.env.UMLESS_TRY_GLOBAL, 30),
  maxConcurrent: num(process.env.UMLESS_TRY_CONCURRENT, 2),
  dailyUsd: num(process.env.UMLESS_TRY_DAILY_USD, 3),
  burstPerMin: num(process.env.UMLESS_TRY_BURST, 6),
  modes: (process.env.UMLESS_TRY_MODES || "cut,studio,score").split(",").map((s) => s.trim()),
});

export const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

// Behind the Cloudflare Worker the real client IP comes in a header signed with a shared key; anything else
// (direct hits on the tunnel) uses the right-most X-Forwarded-For entry, which the tunnel itself appended.
export function clientIp(req: Request): string {
  const key = process.env.UMLESS_PROXY_KEY;
  if (key && req.headers.get("x-umless-proxy-key") === key) {
    const ip = req.headers.get("x-umless-client-ip");
    if (ip) return ip.trim();
  }
  const xff = (req.headers.get("x-forwarded-for") || "").split(",").map((s) => s.trim()).filter(Boolean);
  return xff[xff.length - 1] || "unknown";
}

// Emails and IPs are stored hashed: the ledger only needs to count, not to know who.
const hash = (s: string) => createHash("sha256").update((process.env.ADMIN_KEY || "umless") + ":" + s).digest("hex").slice(0, 24);
const today = () => new Date().toISOString().slice(0, 10);

type Ledger = { day: string; jobs: { e: string; ip: string; at: number }[]; hits: { ip: string; at: number }[] };
const ledgerFile = () => path.join(process.cwd(), "data", "try-ledger.json");

async function load(): Promise<Ledger> {
  try {
    const l = JSON.parse(await fs.readFile(ledgerFile(), "utf8")) as Ledger;
    if (l.day === today()) return l;
  } catch {
    // first run or corrupt file: start a fresh day
  }
  return { day: today(), jobs: [], hits: [] };
}

async function store(l: Ledger) {
  await fs.mkdir(path.dirname(ledgerFile()), { recursive: true });
  const tmp = ledgerFile() + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(l));
  await fs.rename(tmp, ledgerFile());
}

// Daily spend guard: OpenRouter reports today's usage for the key. Fail closed if it can't be read.
let spendCache: { at: number; usd: number | null } = { at: 0, usd: null };
export async function spentTodayUsd(): Promise<number | null> {
  if (Date.now() - spendCache.at < 60_000) return spendCache.usd;
  let usd: number | null = null;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/key", {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const d = (await res.json())?.data;
      if (typeof d?.usage_daily === "number") usd = d.usage_daily;
    }
  } catch {
    usd = null;
  }
  spendCache = { at: Date.now(), usd };
  return usd;
}

export type TryRequest = { email: string; ip: string; mode: string; size: number; running: number };
export type TryResult = { ok: true; release: () => Promise<void> } | { ok: false; status: number; error: string };

const BUSY = "The free tier is full for today. Try again tomorrow, or order a done-for-you cleanup on umless.thoufeekxlabs.com.";

// Serialised so two uploads can't both take the last slot.
let chain: Promise<unknown> = Promise.resolve();
export function checkTry(r: TryRequest, spend = spentTodayUsd): Promise<TryResult> {
  const run = chain.then(() => decide(r, spend));
  chain = run.catch(() => undefined);
  return run;
}

async function decide(r: TryRequest, spend: () => Promise<number | null>): Promise<TryResult> {
  const lim = tryLimits();
  const l = await load();
  const now = Date.now();
  const ip = hash(r.ip);
  l.hits = l.hits.filter((h) => now - h.at < 60_000);
  l.hits.push({ ip, at: now });
  await store(l);

  if (l.hits.filter((h) => h.ip === ip).length > lim.burstPerMin) return { ok: false, status: 429, error: "Too many requests. Wait a minute and try again." };
  const email = r.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, status: 400, error: "Enter your email to get your free clip." };
  if (!lim.modes.includes(r.mode)) return { ok: false, status: 403, error: "That mode isn't part of the free try. Clean Cut and Studio Sound are." };
  if (r.size > lim.maxBytes) return { ok: false, status: 413, error: `Free tries are up to ${Math.round(lim.maxBytes / 1048576)} MB and 10 minutes.` };
  const e = hash(email);
  if (l.jobs.filter((j) => j.e === e).length >= lim.perEmailPerDay) return { ok: false, status: 429, error: "You've used today's free clip. Come back tomorrow, or order a done-for-you cleanup." };
  if (l.jobs.filter((j) => j.ip === ip).length >= lim.perIpPerDay) return { ok: false, status: 429, error: "This network has used today's free clips. Come back tomorrow." };
  if (l.jobs.length >= lim.globalPerDay) return { ok: false, status: 503, error: BUSY };
  if (r.running >= lim.maxConcurrent) return { ok: false, status: 503, error: "Busy cleaning other videos right now. Try again in a couple of minutes." };
  const usd = await spend();
  if (usd === null || usd >= lim.dailyUsd) return { ok: false, status: 503, error: BUSY };

  // Reserve the slot inside the serialised section; release() gives it back if the upload then fails.
  const at = Date.now();
  l.jobs.push({ e, ip, at });
  await store(l);
  return {
    ok: true,
    release: () => {
      const run = chain.then(async () => {
        const cur = await load();
        cur.jobs = cur.jobs.filter((j) => !(j.e === e && j.at === at));
        await store(cur);
      });
      chain = run.catch(() => undefined);
      return run;
    },
  };
}

// The email joins the main waitlist (D1, source=try) through the landing site's public API. Best effort.
export function recordTryEmail(email: string) {
  const url = process.env.UMLESS_WAITLIST_URL || "https://umless.thoufeekxlabs.com/api/waitlist";
  void fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "umless-app" },
    body: JSON.stringify({ email: email.trim().toLowerCase(), source: "try" }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => {});
}
