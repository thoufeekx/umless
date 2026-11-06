// First-party funnel tracking: one JSON line per event in data/events.jsonl. No third-party tags, no IPs, no emails.
import { promises as fs } from "node:fs";
import path from "node:path";

export const STAGES = ["visit", "engaged", "tool_start", "score_done", "waitlist_join", "checkout_click", "paid"] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_LABELS: Record<Stage, string> = {
  visit: "Visited",
  engaged: "Engaged",
  tool_start: "Uploaded",
  score_done: "Got score",
  waitlist_join: "Joined waitlist",
  checkout_click: "Clicked buy",
  paid: "Paid",
};

export type TrackEvent = {
  ts: string;
  vid: string;
  sid: string;
  event: string;
  path: string;
  ref?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  src?: string;
  props?: Record<string, string | number | boolean | null>;
};

const dataDir = () => process.env.UMLESS_DATA_DIR || path.join(process.cwd(), "data");
const eventsFile = () => path.join(dataDir(), "events.jsonl");
const waitlistFile = () => path.join(dataDir(), "waitlist.jsonl");

export async function appendEvent(e: TrackEvent) {
  await fs.mkdir(dataDir(), { recursive: true });
  await fs.appendFile(eventsFile(), JSON.stringify(e) + "\n");
}

// For server-side events (e.g. `paid` from a Stripe webhook) where we only know the visitor id.
export async function recordServerEvent(vid: string, event: string, props?: TrackEvent["props"]) {
  await appendEvent({ ts: new Date().toISOString(), vid, sid: "server", event, path: "", props });
}

async function readJsonl<T>(file: string): Promise<T[]> {
  const raw = await fs.readFile(file, "utf8").catch(() => "");
  const out: T[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      // a half-written line from a crash; skip it
    }
  }
  return out;
}

// sinceDays = 0 or omitted -> everything.
export async function loadEvents(sinceDays?: number): Promise<TrackEvent[]> {
  const all = await readJsonl<TrackEvent>(eventsFile());
  if (!sinceDays) return all;
  const cutoff = Date.now() - sinceDays * 86400_000;
  return all.filter((e) => Date.parse(e.ts) >= cutoff);
}

// Our `?s=` code wins, then utm_source, then the referrer host, else "direct".
const REF_NAMES: [RegExp, string][] = [
  [/(^|\.)(t\.co|x\.com|twitter\.com)$/, "x"],
  [/(^|\.)google\./, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
  [/(^|\.)producthunt\.com$/, "producthunt"],
  [/(^|\.)reddit\.com$/, "reddit"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "linkedin"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)news\.ycombinator\.com$/, "hackernews"],
  [/(^|\.)(chatgpt\.com|openai\.com)$/, "chatgpt"],
  [/(^|\.)perplexity\.ai$/, "perplexity"],
  [/(^|\.)claude\.ai$/, "claude"],
];

export function sourceOf(e: Pick<TrackEvent, "src" | "utm_source" | "ref">): string {
  if (e.src) return e.src.toLowerCase();
  if (e.utm_source) return e.utm_source.toLowerCase();
  if (e.ref) {
    const host = e.ref.toLowerCase().replace(/^www\./, "");
    for (const [re, name] of REF_NAMES) if (re.test(host)) return name;
    return host;
  }
  return "direct";
}

// First-touch source per visitor: the first event that carried any attribution, else their first event.
export function firstTouch(events: TrackEvent[]): Map<string, string> {
  const sorted = [...events].sort((a, b) => a.ts.localeCompare(b.ts));
  const out = new Map<string, string>();
  const seen = new Set<string>();
  for (const e of sorted) {
    const hasAttr = !!(e.src || e.utm_source || e.ref);
    if (!out.has(e.vid) || (!seen.has(e.vid) && hasAttr)) out.set(e.vid, sourceOf(e));
    if (hasAttr) seen.add(e.vid);
  }
  return out;
}

export type StageCounts = Record<Stage, number>;
export type FunnelResult = {
  total: StageCounts;
  bySource: { source: string; counts: StageCounts }[];
  daily: { date: string; visitors: number; joins: number; paid: number }[];
};

const emptyCounts = (): StageCounts => Object.fromEntries(STAGES.map((s) => [s, 0])) as StageCounts;

// Unique visitors at each stage, overall and per first-touch source. Pass the full history as
// `attribution` so a visitor who came from X last month and converts today still counts for X.
export function funnel(events: TrackEvent[], attribution: TrackEvent[] = events): FunnelResult {
  const touch = firstTouch(attribution);
  const reached = new Map<Stage, Set<string>>(STAGES.map((s) => [s, new Set<string>()]));
  for (const e of events) if ((STAGES as readonly string[]).includes(e.event)) reached.get(e.event as Stage)!.add(e.vid);
  // Anyone who did anything has visited; anyone who used the tool or joined was engaged.
  const visit = reached.get("visit")!;
  const engaged = reached.get("engaged")!;
  for (const s of STAGES) for (const v of reached.get(s)!) visit.add(v);
  for (const s of STAGES.slice(2)) for (const v of reached.get(s)!) engaged.add(v);

  const total = emptyCounts();
  const per = new Map<string, StageCounts>();
  for (const s of STAGES) {
    for (const v of reached.get(s)!) {
      total[s]++;
      const src = touch.get(v) || "direct";
      if (!per.has(src)) per.set(src, emptyCounts());
      per.get(src)![s]++;
    }
  }

  const days = new Map<string, { v: Set<string>; j: Set<string>; p: Set<string> }>();
  for (const e of events) {
    const d = e.ts.slice(0, 10);
    if (!days.has(d)) days.set(d, { v: new Set(), j: new Set(), p: new Set() });
    const day = days.get(d)!;
    day.v.add(e.vid);
    if (e.event === "waitlist_join") day.j.add(e.vid);
    if (e.event === "paid") day.p.add(e.vid);
  }
  const daily = [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({ date, visitors: d.v.size, joins: d.j.size, paid: d.p.size }));

  return {
    total,
    bySource: [...per.entries()].map(([source, counts]) => ({ source, counts })).sort((a, b) => b.counts.visit - a.counts.visit),
    daily,
  };
}

export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

// Plain rules that turn the numbers into a to-do list.
export function advice(f: FunnelResult): string[] {
  const out: string[] = [];
  const t = f.total;
  if (t.visit === 0) return ["No visitors yet. Post the Day-1 thread with a ?s= link (e.g. ?s=x-thread-1) so every visit is attributed."];
  const top = f.bySource[0];
  if (top && top.counts.visit >= 20 && pct(top.counts.waitlist_join, top.counts.visit) < 2)
    out.push(`"${top.source}" sends the most visitors (${top.counts.visit}) but under 2% join. Fix the hook for ${top.source}: match the landing headline to the post that sent them.`);
  for (const s of f.bySource) if (s.counts.waitlist_join >= 3) out.push(`Double down on "${s.source}": ${s.counts.waitlist_join} joins from ${s.counts.visit} visits (${pct(s.counts.waitlist_join, s.counts.visit)}%).`);
  if (t.visit >= 30 && pct(t.engaged, t.visit) < 30) out.push(`Only ${pct(t.engaged, t.visit)}% engage. The first screen isn't landing: make the before/after video play above the fold.`);
  if (t.engaged >= 20 && pct(t.tool_start, t.engaged) < 10) out.push(`Few engaged visitors try the free Um Score (${pct(t.tool_start, t.engaged)}%). Put the upload box higher and say "free, no signup".`);
  if (t.tool_start >= 10 && pct(t.score_done, t.tool_start) < 70) out.push(`${t.tool_start - t.score_done} uploads never got a score. Check errors and file limits in /studio and /um-score.`);
  if (t.score_done >= 10 && pct(t.waitlist_join, t.score_done) < 15) out.push(`People get their score but don't join (${pct(t.waitlist_join, t.score_done)}%). Show the cleaned clip preview right after the score.`);
  if (t.waitlist_join >= 10 && t.checkout_click === 0) out.push(`${t.waitlist_join} on the waitlist and nobody clicked buy. Email them a founding-price link and DM the top 10 by score.`);
  if (t.checkout_click >= 5 && t.paid === 0) out.push(`${t.checkout_click} clicked buy, 0 paid. Something breaks at checkout or the price shocks: check the Stripe flow and offer the $12 single video.`);
  if (!out.length) out.push("Nothing alarming. Keep posting daily and tag every link with ?s=.");
  return out;
}

export type WaitlistRow = { email: string; plan?: string; source?: string; score?: number | null; at?: string; [k: string]: unknown };

// waitlist.jsonl holds "join" rows plus later "answers" rows (same id); fold the answers into each join.
export async function loadWaitlist(): Promise<WaitlistRow[]> {
  const rows = await readJsonl<WaitlistRow>(waitlistFile());
  const answers = new Map<unknown, Record<string, unknown>>();
  for (const r of rows) if (r.type === "answers") answers.set(r.id, { ...answers.get(r.id), ...(r.answers as Record<string, unknown>) });
  return rows
    .filter((r) => r.type !== "answers")
    .map(({ type: _t, id, code: _c, ...r }) => ({ ...r, ...(answers.get(id) || {}) }) as WaitlistRow);
}

export function maskEmail(email: string): string {
  const [user, domain] = String(email).split("@");
  if (!domain) return "***";
  return `${user.slice(0, 1)}***@${domain}`;
}

// Plain-text daily digest, shared by scripts/digest.ts and /api/digest (for Hermes / Telegram).
export async function digestText(days = 7): Promise<string> {
  const all = await loadEvents();
  const now = Date.now();
  const inRange = (from: number, to: number) => all.filter((e) => Date.parse(e.ts) >= from && Date.parse(e.ts) < to);

  const yesterday = funnel(inRange(now - 86400_000, now), all);
  const week = funnel(inRange(now - days * 86400_000, now), all);
  const waitlist = await loadWaitlist();
  const newJoins = waitlist.filter((w) => w.at && Date.parse(w.at) >= now - 86400_000).length;

  const lines: string[] = [];
  lines.push(`Umless digest · ${new Date().toISOString().slice(0, 10)}`);
  lines.push("");
  lines.push(`Last 24h vs ${days}-day daily average:`);
  for (const s of STAGES) {
    const avg = week.total[s] / days;
    lines.push(`  ${STAGE_LABELS[s].padEnd(16)} ${String(yesterday.total[s]).padStart(4)}   (avg ${avg.toFixed(1)})`);
  }
  lines.push("");
  lines.push(`New waitlist signups (24h): ${newJoins} · total: ${waitlist.length}`);
  lines.push("");
  lines.push(`Top sources (${days} days):`);
  if (!week.bySource.length) lines.push("  none yet");
  for (const { source, counts } of week.bySource.slice(0, 5))
    lines.push(`  ${source.padEnd(18)} ${counts.visit} visits · ${counts.waitlist_join} joins (${pct(counts.waitlist_join, counts.visit)}%) · ${counts.paid} paid`);
  lines.push("");
  lines.push("What to do next:");
  for (const t of advice(week)) lines.push(`  - ${t}`);
  return lines.join("\n");
}
