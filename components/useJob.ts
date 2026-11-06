"use client";
import { useEffect, useState } from "react";
import type { Job } from "@/lib/jobs";
import { track } from "@/components/Track";

export function useJob() {
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // /studio?job=<id> reopens a finished (or running) job, so results can be shared by link.
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("job");
    if (id && /^[a-f0-9-]{36}$/.test(id)) setJob({ id, status: "queued", step: "Loading" } as Job);
  }, []);

  async function start(file: File, mode: string, voice = "me") {
    setError("");
    setJob(null);
    setBusy(true);
    track("tool_start", { mode });
    const body = new FormData();
    body.append("file", file);
    body.append("mode", mode);
    body.append("voice", voice);
    const res = await fetch("/api/jobs", { method: "POST", body });
    const j = await res.json();
    if (!res.ok) {
      setError(j.error || "Upload failed");
      setBusy(false);
      return;
    }
    setJob({ id: j.id, status: "queued", step: "Uploaded" } as Job);
    history.replaceState(null, "", `?job=${j.id}`);
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

  return { job, error: error || job?.error || "", busy, start };
}
