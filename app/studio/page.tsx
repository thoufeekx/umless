"use client";
import { useState } from "react";
import { Transcript } from "@/components/Transcript";
import { TryError, TryProgress, TryResult } from "@/components/TryResult";
import { EMAIL_OK, TryEmail } from "@/components/TryEmail";
import { TRY, useJob } from "@/components/useJob";
import { explainUpload, type Explained } from "@/lib/result";

const MAX_MB = 200;
const MAX_SEC = 600;

// Checked in the browser before uploading, so an over-long clip doesn't use up the day's free try
// (the server only learns the duration after the upload).
function readDuration(f: File): Promise<number | null> {
  return new Promise((resolve) => {
    const v = document.createElement(f.type.startsWith("audio") ? "audio" : "video");
    const url = URL.createObjectURL(f);
    const done = (d: number | null) => {
      URL.revokeObjectURL(url);
      resolve(d);
    };
    v.preload = "metadata";
    v.onloadedmetadata = () => done(Number.isFinite(v.duration) ? v.duration : null);
    v.onerror = () => done(null);
    setTimeout(() => done(null), 5000);
    v.src = url;
  });
}

const MODES = [
  { id: "cut", name: "Clean Cut", desc: "Removes ums, stutters, retakes and dead air. Your real voice." },
  { id: "studio", name: "Clean Cut + Studio Sound", desc: "Also strips echo, fans and keyboard noise." },
  { id: "revoice", name: "Re-voice", desc: "Polishes your script and re-records it in a clean, confident voice, synced to your screen." },
];

const VOICES = [
  { id: "me", name: "My own voice (cloned per job, never stored)" },
  { id: "stock:Puck", name: "Puck · upbeat male" },
  { id: "stock:Charon", name: "Charon · calm, deep male" },
  { id: "stock:Kore", name: "Kore · firm female" },
  { id: "stock:Aoede", name: "Aoede · bright female" },
];

export default function Studio() {
  const { job, error, busy, start, uploadPct, startedAt } = useJob();
  const [file, setFile] = useState<File | null>(null);
  const [fileErr, setFileErr] = useState<Explained | null>(null);
  const [mode, setMode] = useState("cut");
  const [voice, setVoice] = useState("me");
  const [email, setEmail] = useState("");
  const modes = TRY ? MODES.filter((m) => m.id !== "revoice") : MODES;
  const ready = !!file && !fileErr && !busy && (!TRY || EMAIL_OK(email));
  const s = job?.stats;
  const running = busy || (!!job && job.status !== "done" && job.status !== "error");
  const go = () => file && start(file, mode, voice, email);

  async function pick(f: File | null) {
    setFile(f);
    setFileErr(null);
    if (!f || !TRY) return;
    if (f.size > MAX_MB * 1024 * 1024) return setFileErr(explainUpload(413));
    const d = await readDuration(f);
    if (d && d > MAX_SEC)
      setFileErr({ title: `This clip is ${Math.round(d / 60)} minutes long.`, detail: "The free try takes up to 10 minutes. Trim it first, or have the full video cleaned for you.", next: "order" });
  }

  return (
    <>
      <h1>Studio</h1>
      <p className="lead">Upload a demo, a talking-head video or a voice note. Get it back sounding like you nailed it in one take.</p>

      <div className="grid" style={{ marginTop: 24 }}>
        {modes.map((m) => (
          <label key={m.id} className={`card ${mode === m.id ? "pop" : ""}`} style={{ cursor: "pointer" }}>
            <input type="radio" name="mode" checked={mode === m.id} onChange={() => setMode(m.id)} /> <strong>{m.name}</strong>
            <p className="small muted" style={{ margin: "6px 0 0" }}>{m.desc}</p>
          </label>
        ))}
      </div>

      {mode === "revoice" && (
        <p className="row" style={{ marginTop: 16 }}>
          <span>Voice:</span>
          <select value={voice} onChange={(e) => setVoice(e.target.value)}>
            {VOICES.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </p>
      )}

      <div className="drop" style={{ marginTop: 20 }}>
        <input type="file" accept="video/*,audio/*" onChange={(e) => void pick(e.target.files?.[0] || null)} />
        <TryEmail email={email} setEmail={setEmail} />
        <div style={{ marginTop: 16 }}>
          <button className="btn" disabled={!ready} onClick={go}>
            {running ? "Working…" : TRY ? "Clean my clip free" : "Fix my video"}
          </button>
          {TRY && !file && <p className="small muted" style={{ margin: "8px 0 0" }}>Pick a clip and enter your email to start.</p>}
          {TRY && file && !EMAIL_OK(email) && !fileErr && <p className="small muted" style={{ margin: "8px 0 0" }}>Enter your email to start.</p>}
        </div>
      </div>
      {fileErr && <TryError e={fileErr} />}
      {error && <TryError e={error} onRetry={file ? go : undefined} />}
      {running && <TryProgress job={job} mode={mode} uploadPct={uploadPct} startedAt={startedAt} />}

      {job?.status === "done" && job.output && s && (
        <>
          {TRY ? (
            <TryResult job={job} />
          ) : (
            <h2>
              Done. {s.fillerCount + s.repeatCount + s.retakeCount} mistakes and {Math.round(s.savedSec || 0)}s of waffle removed.
            </h2>
          )}
          <div className="ba" style={{ marginTop: 24 }}>
            <div>
              <span className="tag">Before · {Math.round(job.duration || 0)}s</span>
              <video src={`/api/jobs/${job.id}/file?v=original`} controls playsInline preload="metadata" />
            </div>
            <div>
              <span className="tag hot">After · {Math.round(s.outDuration || 0)}s</span>
              <video src={`/api/jobs/${job.id}/file`} controls playsInline preload="metadata" />
            </div>
          </div>
          <p className="row" style={{ marginTop: 16 }}>
            <a className={TRY ? "btn ghost" : "btn"} href={`/api/jobs/${job.id}/file?download`}>Download the clean clip</a>
            {job.voiceUsed && <span className="small muted">Voice: {job.voiceUsed}</span>}
          </p>
          {job.lines && (
            <>
              <h2>Your polished script</h2>
              {job.lines.map((l, i) => (
                <div key={i} className="card" style={{ marginBottom: 10 }}>
                  <div className="small muted"><s>{l.original}</s></div>
                  <div>{l.polished}</div>
                </div>
              ))}
            </>
          )}
          <h2>What we cut</h2>
          <Transcript words={job.transcript || []} />
        </>
      )}
    </>
  );
}
