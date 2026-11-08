// What the free-try result screen shows: a before/after summary, the share line and plain-words upload errors.
// Pure (no Node imports) so the browser can use it and the tests can pin it down.
import { isFiller, umScore } from "./score";

export const ORDER_URL = "https://umless.thoufeekxlabs.com/order/?ref=try-result";
export const MCP_URL = "https://github.com/thoufeekx/umless#use-it-from-ai-agents-mcp-server-and-claude-skill";
export const SHARE_URL = "https://umless.thoufeekxlabs.com/?ref=share";

type Stats = {
  score: number;
  fillerCount: number;
  repeatCount: number;
  retakeCount: number;
  deadAirSec: number;
  savedSec?: number;
  outDuration?: number;
};
type JobLike = { duration?: number; stats?: Stats; transcript?: { text: string; cut?: string }[] };

export type Summary = {
  beforeSec: number;
  afterSec: number;
  savedSec: number;
  savedPct: number;
  ums: number;
  repeats: number;
  retakes: number;
  silenceSec: number;
  scoreBefore: number;
  scoreAfter: number;
};

const r1 = (n: number) => Math.round(n * 10) / 10;

// The "after" Um Score is scored on the cleaned cut: what's left in the transcript over the new length.
// Repeats and retakes we found are gone, long pauses are shrunk below the dead-air threshold, and any
// filler the cut kept (rare) still counts against it.
export function summarize(job: JobLike): Summary | null {
  const s = job.stats;
  if (!s || !job.duration) return null;
  const beforeSec = job.duration;
  const afterSec = s.outDuration ?? beforeSec;
  const savedSec = s.savedSec ?? Math.max(0, beforeSec - afterSec);
  const leftFillers = (job.transcript || []).filter((w) => !w.cut && isFiller(w.text)).length;
  return {
    beforeSec: r1(beforeSec),
    afterSec: r1(afterSec),
    savedSec: r1(savedSec),
    savedPct: Math.round((savedSec / beforeSec) * 100),
    ums: s.fillerCount,
    repeats: s.repeatCount,
    retakes: s.retakeCount,
    silenceSec: s.deadAirSec,
    scoreBefore: s.score,
    scoreAfter: Math.max(s.score, umScore({ fillerCount: leftFillers, stumbleCount: 0, deadAirSec: 0, duration: afterSec })),
  };
}

export const fmtSec = (sec: number) => {
  const t = Math.round(sec);
  return t < 60 ? `${t}s` : `${Math.floor(t / 60)}m ${String(t % 60).padStart(2, "0")}s`;
};

export function shareText(m: Summary): string {
  const cut = [m.ums && `${m.ums} um${m.ums === 1 ? "" : "s"}`, m.silenceSec >= 1 && `${Math.round(m.silenceSec)}s of dead air`]
    .filter(Boolean)
    .join(" and ");
  const what = cut ? `Umless cut ${cut} from my ${fmtSec(m.beforeSec)} clip` : `Umless tightened my ${fmtSec(m.beforeSec)} clip`;
  return `My Um Score went from ${m.scoreBefore} to ${m.scoreAfter}/100. ${what}. Try yours free: ${SHARE_URL}`;
}

// Upload rejections from /api/jobs (lib/trygate.ts) in plain words, with the next step.
export type Explained = { title: string; detail: string; next: "retry" | "order" | "fix" | "none" };
export function explainUpload(status: number, serverMsg = ""): Explained {
  const msg = serverMsg.trim();
  if (status === 0 || status === 502 || status === 504)
    return { title: "The upload didn't reach us.", detail: "Check your connection and try again. Big files can take a few minutes on slow Wi-Fi.", next: "retry" };
  if (status === 429 && /wait a minute/i.test(msg))
    return { title: "Too many tries in a row.", detail: "Wait a minute, then press the button again. Nothing was used up.", next: "retry" };
  if (status === 429)
    return {
      title: "You've used today's free clip.",
      detail: `${/used today's free clip/i.test(msg) || !msg ? "The free try is 1 clip per email per day." : msg} It resets at midnight UTC. Want the full video cleaned today? We do it for you and you pay after delivery.`,
      next: "order",
    };
  if (status === 503)
    return {
      title: "The free cleaner is busy right now.",
      detail: `${msg || "Too many people are cleaning videos at once."} Your free clip was not used. You can also have the full video cleaned for you.`,
      next: /couple of minutes/i.test(msg) ? "retry" : "order",
    };
  if (status === 413)
    return { title: "That file is too big for the free try.", detail: "Free clips are up to 200 MB and 10 minutes. Trim it or export at 720p, then upload again.", next: "fix" };
  if (status === 403)
    return { title: "That option isn't in the free try.", detail: "Pick Clean Cut or Clean Cut + Studio Sound, then press the button again.", next: "fix" };
  if (status === 400 || status === 411) return { title: msg || "Something is missing.", detail: "Pick a video or audio file and enter your email.", next: "fix" };
  return { title: "Upload failed.", detail: msg || "Try again in a minute.", next: "retry" };
}

// A failed job (lib/jobs.ts) in plain words. Network/provider errors aren't the visitor's fault.
export function explainJobError(err = "", refunded = false): Explained {
  const service = /fetch failed|ECONN|ETIMEDOUT|timeout|aborted|socket|\b5\d\d\b|rate limit|429/i.test(err);
  const back = refunded ? " Your free clip wasn't used, so you can try again." : "";
  if (service)
    return { title: "Our speech-to-text service didn't respond.", detail: `That's on our side, not your clip.${back}`, next: "retry" };
  return { title: "We couldn't clean this clip.", detail: `${err || "Something went wrong while processing."}${back} Try a different clip, or have the full video cleaned for you.`, next: "order" };
}
