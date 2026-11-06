// Waitlist: step 1 stores the email, step 2 (PATCH) adds the qualifying answers.
// Rows are append-only JSON lines in data/waitlist.jsonl: {type:"join",...} and {type:"answers", id, answers}.
import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

const file = () => path.join(process.cwd(), "data", "waitlist.jsonl");
type Join = { type: "join"; id: string; code: string; email: string; plan: string; source: string; score: number | null; ref: string | null; vid: string | null; at: string };

async function rows(): Promise<Record<string, unknown>[]> {
  const txt = await fs.readFile(file(), "utf8").catch(() => "");
  return txt.split("\n").filter(Boolean).flatMap((l) => {
    try {
      return [JSON.parse(l)];
    } catch {
      return [];
    }
  });
}

const append = async (row: object) => {
  await fs.mkdir(path.dirname(file()), { recursive: true });
  await fs.appendFile(file(), JSON.stringify(row) + "\n");
};

// Real place in line: join order, moved up 5 spots per friend who joined with your link.
function position(joins: Join[], me: Join) {
  const referrals = joins.filter((j) => j.ref === me.code).length;
  return { position: Math.max(1, joins.indexOf(me) + 1 - referrals * 5), referrals, total: joins.length };
}

const joinsOf = (all: Record<string, unknown>[]) =>
  // Rows from before the two-step form have no type/id; treat them as joins.
  all.filter((r) => !r.type || r.type === "join").map((r, i) => ({ ...r, id: r.id || `legacy-${i}`, code: r.code || `legacy${i}` }) as Join);

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) return Response.json({ error: "Enter a valid email." }, { status: 400 });
  const joins = joinsOf(await rows());
  let me = joins.find((j) => j.email === email);
  if (!me) {
    me = {
      type: "join",
      id: randomBytes(9).toString("base64url"),
      code: randomBytes(4).toString("hex"),
      email,
      plan: String(b.plan || "").slice(0, 40),
      source: String(b.source || "").slice(0, 60),
      score: typeof b.score === "number" ? b.score : null,
      ref: typeof b.ref === "string" && /^[a-f0-9]{8}$/.test(b.ref) ? b.ref : null,
      vid: req.headers.get("cookie")?.match(/(?:^|;\s*)uv=([^;]+)/)?.[1] ?? null,
      at: new Date().toISOString(),
    };
    await append(me);
    joins.push(me);
  }
  return Response.json({ ok: true, id: me.id, code: me.code, ...position(joins, me) });
}

const ANSWER_KEYS = ["role", "records", "frequency", "pain", "price", "apps", "x", "note"] as const;

export async function PATCH(req: Request) {
  const b = await req.json().catch(() => ({}));
  const joins = joinsOf(await rows());
  const me = joins.find((j) => j.id === b.id);
  if (!me) return Response.json({ error: "Join the waitlist first." }, { status: 404 });
  const answers: Record<string, string | string[]> = {};
  for (const k of ANSWER_KEYS) {
    const v = b.answers?.[k];
    if (Array.isArray(v)) answers[k] = v.map(String).slice(0, 8).map((s) => s.slice(0, 60));
    else if (v != null && v !== "") answers[k] = String(v).slice(0, 500);
  }
  await append({ type: "answers", id: me.id, answers, at: new Date().toISOString() });
  return Response.json({ ok: true, ...position(joins, me) });
}
