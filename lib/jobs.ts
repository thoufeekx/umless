// File-backed job queue. Good enough for the MVP; swap for Supabase + a worker when we have paying users.
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  analyze,
  extractAudio,
  keepSegments,
  polish,
  probe,
  renderCut,
  renderRevoice,
  sentences,
  studioSound,
  transcribe,
  voiceSample,
  type Voice,
} from "./pipeline";

export type Mode = "score" | "cut" | "studio" | "revoice";
export type Job = {
  id: string;
  mode: Mode;
  voice: string; // "me" (clone of the speaker) | "stock:<Gemini voice>"
  status: "queued" | "working" | "done" | "error";
  step: string;
  error?: string;
  createdAt: string;
  inputName: string;
  hasVideo?: boolean;
  duration?: number;
  stats?: {
    score: number;
    fillerCount: number;
    repeatCount: number;
    retakeCount: number;
    deadAirSec: number;
    fillersPerMin: number;
    topFillers: [string, number][];
    savedSec?: number;
    outDuration?: number;
  };
  transcript?: { text: string; cut?: string }[];
  lines?: { original: string; polished: string }[];
  output?: string;
  voiceUsed?: string;
};

export const MAX_FREE_SEC = 600;
const root = () => path.join(process.cwd(), "data", "jobs");
export const jobDir = (id: string) => path.join(root(), id);

async function save(job: Job) {
  await fs.writeFile(path.join(jobDir(job.id), "job.json"), JSON.stringify(job, null, 2));
}

export async function getJob(id: string): Promise<Job | null> {
  if (!/^[a-f0-9-]{36}$/.test(id)) return null;
  try {
    return JSON.parse(await fs.readFile(path.join(jobDir(id), "job.json"), "utf8"));
  } catch {
    return null;
  }
}

// Keeps the promise on the site: nothing we process lives longer than 24 hours.
async function sweepOldJobs() {
  const cutoff = Date.now() - 24 * 3600 * 1000;
  for (const id of await fs.readdir(root()).catch(() => [] as string[])) {
    const st = await fs.stat(jobDir(id)).catch(() => null);
    if (st && st.mtimeMs < cutoff) await fs.rm(jobDir(id), { recursive: true, force: true });
  }
}

export async function createJob(file: File, mode: Mode, voice: string): Promise<Job> {
  void sweepOldJobs();
  const id = randomUUID();
  await fs.mkdir(jobDir(id), { recursive: true });
  const ext = (path.extname(file.name) || ".mp4").toLowerCase().replace(/[^.a-z0-9]/g, "");
  await fs.writeFile(path.join(jobDir(id), "input" + ext), Buffer.from(await file.arrayBuffer()));
  const job: Job = { id, mode, voice, status: "queued", step: "Uploaded", createdAt: new Date().toISOString(), inputName: "input" + ext };
  await save(job);
  void runJob(job);
  return job;
}

async function runJob(job: Job) {
  const dir = jobDir(job.id);
  const input = path.join(dir, job.inputName);
  const step = async (s: string) => {
    job.status = "working";
    job.step = s;
    await save(job);
  };
  try {
    await step("Reading your file");
    const { duration, hasVideo } = await probe(input);
    job.duration = duration;
    job.hasVideo = hasVideo;
    if (duration > MAX_FREE_SEC) throw new Error("Files up to 10 minutes for now.");

    await step("Listening for ums, stutters and retakes");
    const wav = path.join(dir, "audio.wav");
    await extractAudio(input, wav);
    const words = await transcribe(wav);
    if (!words.length) throw new Error("We couldn't hear any speech in this file.");
    const a = await analyze(words, duration);
    job.stats = {
      score: a.score,
      fillerCount: a.fillerCount,
      repeatCount: a.repeatCount,
      retakeCount: a.retakeCount,
      deadAirSec: a.deadAirSec,
      fillersPerMin: a.fillersPerMin,
      topFillers: a.topFillers,
    };
    job.transcript = words.map((w, i) => ({ text: w.text, cut: a.cutIdx[i] }));
    await fs.rm(wav, { force: true });

    if (job.mode !== "score") {
      await step("Cutting the mistakes out");
      const ext = hasVideo ? ".mp4" : ".m4a";
      const clean = path.join(dir, "umless" + ext);
      await renderCut(input, keepSegments(a), clean, hasVideo);
      let final = clean;

      if (job.mode === "studio") {
        await step("Making it sound like a studio mic");
        final = path.join(dir, "umless-studio" + ext);
        await studioSound(clean, final, hasVideo, dir);
      }

      if (job.mode === "revoice") {
        await step("Polishing your script");
        const lines = await polish(sentences(a));
        job.lines = lines.map(({ original, polished }) => ({ original, polished }));
        let voice: Voice;
        if (job.voice.startsWith("stock:")) {
          voice = { kind: "stock", id: job.voice.slice(6) };
          job.voiceUsed = `Pro voice (${job.voice.slice(6)})`;
        } else {
          await step("Learning your voice");
          voice = await voiceSample(clean, dir);
          job.voiceUsed = "Your voice";
        }
        await step("Re-recording it, confidently");
        final = path.join(dir, "umless-revoiced" + ext);
        try {
          await renderRevoice(input, lines, duration, hasVideo, voice, dir, final);
        } finally {
          // Nothing is stored at the voice provider; drop our local sample right away too.
          if (voice.kind === "clone") await fs.rm(voice.ref, { force: true });
        }
      }

      const out = await probe(final);
      job.output = path.basename(final);
      job.stats.outDuration = Math.round(out.duration * 10) / 10;
      job.stats.savedSec = Math.max(0, Math.round((duration - out.duration) * 10) / 10);
    }
    job.status = "done";
    job.step = "Done";
    await save(job);
  } catch (e) {
    job.status = "error";
    job.error = e instanceof Error ? e.message : String(e);
    await save(job);
  }
}
