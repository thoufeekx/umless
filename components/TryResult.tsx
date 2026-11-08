"use client";
// The free-try flow around the upload box: progress while it runs, plain-words errors, and the result screen
// (before/after numbers, a share line for the Um Score, and the two next steps).
import { useEffect, useState } from "react";
import type { Job } from "@/lib/jobs";
import { fmtSec, MCP_URL, ORDER_URL, shareText, summarize, type Explained } from "@/lib/result";
import { track } from "@/components/Track";

const STEPS: Record<string, string[]> = {
  score: ["Reading your file", "Listening for ums, stutters and retakes"],
  cut: ["Reading your file", "Listening for ums, stutters and retakes", "Cutting the mistakes out"],
  studio: ["Reading your file", "Listening for ums, stutters and retakes", "Cutting the mistakes out", "Making it sound like a studio mic"],
  revoice: ["Reading your file", "Listening for ums, stutters and retakes", "Cutting the mistakes out", "Polishing your script", "Re-recording it, confidently"],
};

export function TryProgress({ job, mode, uploadPct, startedAt }: { job: Job | null; mode: string; uploadPct: number | null; startedAt: number | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const steps = ["Uploading", ...(STEPS[job?.mode || mode] || STEPS.cut)];
  const step = uploadPct !== null ? "Uploading" : job?.step === "Uploaded" || job?.step === "Loading" ? "Reading your file" : job?.step || "Uploading";
  const i = steps.indexOf(step);
  const at = i >= 0 ? i : step === "Learning your voice" ? steps.length - 1 : 1;
  const secs = startedAt ? Math.round((now - startedAt) / 1000) : null;
  return (
    <div className="card progress" aria-live="polite">
      <ol>
        {steps.map((s, i) => (
          <li key={s} className={i < at ? "done" : i === at ? "now" : ""}>
            {s}
            {s === "Uploading" && i === at && uploadPct !== null ? ` · ${uploadPct}%` : ""}
          </li>
        ))}
      </ol>
      <p className="small muted" style={{ margin: "10px 0 0" }}>
        {secs !== null ? `${fmtSec(secs)} so far. ` : ""}A short clip usually takes 1 to 3 minutes. Keep this tab open; this page&apos;s link also works for 24 hours.
      </p>
    </div>
  );
}

export function TryError({ e, onRetry }: { e: Explained; onRetry?: () => void }) {
  return (
    <div className="card try-err" role="alert">
      <strong>{e.title}</strong>
      <p className="small" style={{ margin: "6px 0 0" }}>{e.detail}</p>
      {(e.next === "retry" || e.next === "order") && (
        <p className="row" style={{ marginTop: 12 }}>
          {e.next === "retry" && onRetry && <button className="btn small-btn" onClick={onRetry}>Try again</button>}
          {e.next === "order" && (
            <a className="btn small-btn" href={ORDER_URL} onClick={() => track("try_result_cta", { cta: "order", from: "error" })}>
              Clean my full video for me ($149, pay after delivery)
            </a>
          )}
        </p>
      )}
    </div>
  );
}

export function TryResult({ job }: { job: Job }) {
  const m = summarize(job);
  const [copied, setCopied] = useState(false);
  if (!m) return null;
  const line = shareText(m);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(line);
    } catch {
      const t = document.createElement("textarea");
      t.value = line;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopied(true);
    track("share_copy", { score: m.scoreAfter });
  };
  const stumbles = m.repeats + m.retakes;

  return (
    <section className="result">
      <p className="eyebrow">Done</p>
      <h2>
        {fmtSec(m.beforeSec)} → {fmtSec(m.afterSec)}
        {m.savedSec >= 1 ? `: ${fmtSec(m.savedSec)} shorter (${m.savedPct}%)` : ""}
      </h2>
      <div className="ba-stats">
        <div className="score-ba">
          <span className="muted small">Um Score</span>
          <span><s>{m.scoreBefore}</s> → <b>{m.scoreAfter}</b><small>/100</small></span>
        </div>
        <div><b>{m.ums}</b><span>ums cut</span></div>
        <div><b>{m.repeats}</b><span>repeats cut</span></div>
        <div><b>{m.retakes}</b><span>retakes cut</span></div>
        <div><b>{fmtSec(m.silenceSec)}</b><span>silence cut</span></div>
      </div>
      {m.ums + stumbles === 0 && <p className="small muted">This take was already clean; we mostly trimmed pauses.</p>}

      <div className="card pop next">
        <h3>Like it? Get your full video done.</h3>
        <p className="small muted" style={{ margin: "0 0 12px" }}>
          Send us the whole recording. We clean it and send it back; you pay $149 only after you&apos;ve seen it.
        </p>
        <div className="row">
          <a className="btn" href={ORDER_URL} onClick={() => track("try_result_cta", { cta: "order" })}>
            Clean your full video: done for you, pay after delivery ($149)
          </a>
          <a className="btn ghost" href={MCP_URL} target="_blank" rel="noreferrer" onClick={() => track("try_result_cta", { cta: "mcp" })}>
            Use it in Claude/Cursor (MCP)
          </a>
        </div>
      </div>

      <div className="card share">
        <strong>Share your Um Score</strong>
        <p className="share-line">{line}</p>
        <div className="row">
          <button className="btn small-btn ghost" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
          <a
            className="btn small-btn ghost"
            target="_blank"
            rel="noreferrer"
            href={`https://x.com/intent/post?text=${encodeURIComponent(line)}`}
            onClick={() => track("share_x", { score: m.scoreAfter })}
          >
            Post on X
          </a>
          <a
            className="btn small-btn ghost"
            target="_blank"
            rel="noreferrer"
            href={`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(line)}`}
            onClick={() => track("share_linkedin", { score: m.scoreAfter })}
          >
            LinkedIn
          </a>
        </div>
      </div>
    </section>
  );
}
