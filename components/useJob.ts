"use client";
import { useEffect, useState } from "react";
import type { Job } from "@/lib/jobs";
import { track } from "@/components/Track";
import { explainJobError, explainUpload, type Explained } from "@/lib/result";

// Hosted free try (NEXT_PUBLIC_TRY=1): an email is required and big uploads go straight to the tunnel origin.
export const TRY = process.env.NEXT_PUBLIC_TRY === "1";
const UPLOAD_ORIGIN = process.env.NEXT_PUBLIC_UPLOAD_ORIGIN || "";

type Sent = { status: number; body: { id?: string; error?: string } };

// XHR instead of fetch so we can show upload progress (big clips take minutes on slow Wi-Fi).
function send(url: string, body: FormData, headers: Record<string, string>, onPct: (p: number) => void): Promise<Sent> {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open("POST", url);
    for (const [k, v] of Object.entries(headers)) x.setRequestHeader(k, v);
    x.upload.onprogress = (e) => e.lengthComputable && onPct(Math.round((e.loaded / e.total) * 100));
    x.onload = () => {
      let b = {};
      try {
        b = JSON.parse(x.responseText);
      } catch {}
      resolve({ status: x.status, body: b });
    };
    x.onerror = () => reject(new Error("network"));
    x.send(body);
  });
}

export function useJob() {
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<Explained | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  // /studio?job=<id> reopens a finished (or running) job, so results can be shared by link.
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("job");
    if (id && /^[a-f0-9-]{36}$/.test(id)) setJob({ id, status: "queued", step: "Loading" } as Job);
  }, []);

  async function start(file: File, mode: string, voice = "me", email = "") {
    setError(null);
    setJob(null);
    setBusy(true);
    setUploadPct(0);
    setStartedAt(Date.now());
    track("tool_start", { mode });
    const body = new FormData();
    body.append("file", file);
    body.append("mode", mode);
    body.append("voice", voice);
    const headers: Record<string, string> = TRY ? { "x-umless-email": email, "x-umless-mode": mode } : {};
    const post = (origin: string) => send(origin + "/api/jobs", body, headers, setUploadPct);
    let res: Sent;
    try {
      res = await post(UPLOAD_ORIGIN);
    } catch {
      // Direct upload blocked (network, extension)? Small files still fit through the main origin.
      res = UPLOAD_ORIGIN && file.size < 95 * 1024 * 1024 ? await post("").catch(() => ({ status: 0, body: {} })) : { status: 0, body: {} };
    }
    setUploadPct(null);
    if (res.status < 200 || res.status >= 300 || !res.body.id) {
      setError(explainUpload(res.status, res.body.error));
      track("try_rejected", { status: res.status });
      setBusy(false);
      return;
    }
    setJob({ id: res.body.id, status: "queued", step: "Uploaded", mode } as Job);
    history.replaceState(null, "", `?job=${res.body.id}`);
  }

  useEffect(() => {
    if (!job || job.status === "done" || job.status === "error") {
      if (job) setBusy(false);
      if (job?.status === "done") track("score_done", { mode: job.mode, score: job.stats?.score ?? null });
      if (job?.status === "error") track("job_error", { mode: job.mode ?? "" });
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/jobs/${job.id}`);
      if (res.ok) setJob(await res.json());
    }, 1200);
    return () => clearTimeout(t);
  }, [job]);

  const jobErr: Explained | null = job?.status === "error" ? explainJobError(job.error, job.refunded) : null;
  return { job, error: error || jobErr, busy, start, uploadPct, startedAt };
}
