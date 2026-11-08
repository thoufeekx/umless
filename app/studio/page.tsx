"use client";
import { useState } from "react";
import { Transcript } from "@/components/Transcript";
import { EMAIL_OK, TryEmail } from "@/components/TryEmail";
import { TRY, useJob } from "@/components/useJob";

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
  const { job, error, busy, start } = useJob();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState("cut");
  const [voice, setVoice] = useState("me");
  const [email, setEmail] = useState("");
  const modes = TRY ? MODES.filter((m) => m.id !== "revoice") : MODES;
  const ready = !!file && !busy && (!TRY || EMAIL_OK(email));
  const s = job?.stats;

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
        <input type="file" accept="video/*,audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <TryEmail email={email} setEmail={setEmail} />
        <div style={{ marginTop: 16 }}>
          <button className="btn" disabled={!ready} onClick={() => file && start(file, mode, voice, email)}>
            {busy ? job?.step || "Uploading…" : TRY ? "Clean my clip free" : "Fix my video"}
          </button>
        </div>
      </div>
      {error && <p style={{ color: "var(--accent)" }}>{error}</p>}

      {job?.status === "done" && job.output && s && (
        <>
          <h2>
            Done. {s.fillerCount + s.repeatCount + s.retakeCount} mistakes and {Math.round(s.savedSec || 0)}s of waffle removed.
          </h2>
          <div className="ba">
            <div>
              <span className="tag">Before · {Math.round(job.duration || 0)}s</span>
              <video src={`/api/jobs/${job.id}/file?v=original`} controls preload="metadata" />
            </div>
            <div>
              <span className="tag hot">After · {Math.round(s.outDuration || 0)}s</span>
              <video src={`/api/jobs/${job.id}/file`} controls preload="metadata" />
            </div>
          </div>
          <p className="row" style={{ marginTop: 16 }}>
            <a className="btn" href={`/api/jobs/${job.id}/file?download`}>Download</a>
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
