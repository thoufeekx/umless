// Browser -> data/events.jsonl. Accepts JSON fetches and navigator.sendBeacon (text/plain).
import { randomUUID } from "node:crypto";
import { appendEvent, type TrackEvent } from "@/lib/track";

export const runtime = "nodejs";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|curl|wget|python|axios|node-fetch|go-http/i;
const ID = /^[a-z0-9-]{8,40}$/i;
const EVENT = /^[a-z][a-z0-9_]{1,39}$/;
const recent = new Map<string, { minute: number; n: number }>();

const str = (v: unknown, max = 120) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
const looksPersonal = (k: string, v: unknown) => /mail|phone|ip|name|password|token/i.test(k) || (typeof v === "string" && /@|\d{7,}/.test(v));

function cleanProps(p: unknown): TrackEvent["props"] {
  if (!p || typeof p !== "object") return undefined;
  const out: NonNullable<TrackEvent["props"]> = {};
  for (const [k, v] of Object.entries(p as Record<string, unknown>).slice(0, 20)) {
    if (!/^[a-z0-9_]{1,40}$/i.test(k) || looksPersonal(k, v)) continue;
    if (typeof v === "string") out[k] = v.slice(0, 120);
    else if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (typeof v === "boolean" || v === null) out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

function cookie(req: Request, name: string) {
  const m = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(req.headers.get("cookie") || "");
  return m && ID.test(m[1]) ? m[1] : null;
}

export async function POST(req: Request) {
  if (BOT.test(req.headers.get("user-agent") || "")) return new Response(null, { status: 204 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  const event = str(body.event, 40);
  if (!event || !EVENT.test(event)) return new Response(null, { status: 400 });

  const vid = cookie(req, "uv") || randomUUID();
  const sid = cookie(req, "us") || randomUUID();
  const headers = new Headers();
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  headers.append("Set-Cookie", `uv=${vid}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`);
  headers.append("Set-Cookie", `us=${sid}; Path=/; Max-Age=1800; SameSite=Lax${secure}`);

  const minute = Math.floor(Date.now() / 60000);
  const r = recent.get(vid);
  if (r && r.minute === minute && r.n >= 60) return new Response(null, { status: 204, headers });
  recent.set(vid, { minute, n: r && r.minute === minute ? r.n + 1 : 1 });
  if (recent.size > 5000) for (const [k, v] of recent) if (v.minute < minute) recent.delete(k);

  const ref = str(body.ref, 100)?.toLowerCase().replace(/^www\./, "");
  await appendEvent({
    ts: new Date().toISOString(),
    vid,
    sid,
    event,
    path: str(body.path, 200) || "/",
    ref: ref && !/^localhost|^127\.|umless/.test(ref) ? ref : undefined,
    utm_source: str(body.utm_source, 60),
    utm_medium: str(body.utm_medium, 60),
    utm_campaign: str(body.utm_campaign, 80),
    src: str(body.src, 60),
    props: cleanProps(body.props),
  });
  return new Response(null, { status: 204, headers });
}
