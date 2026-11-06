"use client";
import { useState } from "react";
import { ScoreCard } from "@/components/ScoreCard";
import { Transcript } from "@/components/Transcript";
import { useJob } from "@/components/useJob";
import { Waitlist } from "@/components/Waitlist";

export default function UmScore() {
  const { job, error, busy, start } = useJob();
  const [file, setFile] = useState<File | null>(null);
  const s = job?.stats;

  return (
    <>
      <h1>How many times do you say &ldquo;um&rdquo;?</h1>
      <p className="lead">Drop any video or voice note. In about 30 seconds you get your Um Score: ums per minute, stutters, retakes and dead air. Free, no signup.</p>

      <div className="drop" style={{ marginTop: 28 }}>
        <input type="file" accept="video/*,audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <div style={{ marginTop: 16 }}>
          <button className="btn" disabled={!file || busy} onClick={() => file && start(file, "score")}>
            {busy ? job?.step || "Uploading…" : "Get my Um Score"}
          </button>
        </div>
        <p className="small muted">Up to 10 minutes. Files are deleted after 24 hours.</p>
      </div>
      {error && <p style={{ color: "var(--accent)" }}>{error}</p>}

      {s && job?.status === "done" && (
        <>
          <h2>Your Um Score: {s.score}/100</h2>
          <ScoreCard stats={s} duration={job.duration || 0} />
          <div className="grid" style={{ marginTop: 24 }}>
            <div className="card"><div className="stat">{s.fillersPerMin}</div><div className="muted">ums per minute</div></div>
            <div className="card"><div className="stat">{s.repeatCount + s.retakeCount}</div><div className="muted">stutters &amp; retakes</div></div>
            <div className="card"><div className="stat">{s.deadAirSec}s</div><div className="muted">dead air</div></div>
          </div>
          <h2>Here&apos;s everything we&apos;d cut</h2>
          <Transcript words={job.transcript || []} />
          <div className="card pop" style={{ marginTop: 28 }}>
            <h3>Want this video back without the crossed-out bits?</h3>
            <p className="muted">Umless cuts them automatically, and can re-record the whole thing in a clean, confident voice. Founding members lock today's price for life.</p>
            <Waitlist source="um-score" score={s.score} cta="Clean my video" />
          </div>
        </>
      )}
    </>
  );
}
