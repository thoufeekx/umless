// Machine-readable layer over the pipeline, for agents and scripts (MCP server, `umless mcp`).
// analyzeFile() returns a cut list without rendering; cleanFile() renders and returns stats.
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  analyze,
  extractAudio,
  keepSegments,
  probe,
  renderCut,
  studioSound,
  transcribe,
  type Analysis,
  type Cut,
  type Segment,
} from "./pipeline";

export type CutType = "filler" | "repeat" | "retake" | "silence";
export type CutEntry = {
  start: number;
  end: number;
  duration: number;
  type: CutType;
  text: string; // the words removed, "" for pure silence
  reason: string; // one human-readable line
};
export type CutList = {
  input?: string;
  durationBefore: number;
  durationAfter: number; // estimate from the kept segments; cleanFile() reports the rendered length (cuts snap to silence)
  savedSec: number;
  savedPct: number;
  score: number; // Um Score 0-100, higher = cleaner delivery
  fillersPerMin: number;
  counts: { fillers: number; repeats: number; retakes: number; silences: number };
  deadAirSec: number;
  keep: Segment[];
  cuts: CutEntry[];
  transcript: string; // what remains after the cuts
};

const r3 = (n: number) => Math.round(n * 1000) / 1000;
const r1 = (n: number) => Math.round(n * 10) / 10;
const PRIORITY: Cut["reason"][] = ["retake", "repeat", "filler"];
const TYPE: Record<Cut["reason"], CutType> = { filler: "filler", repeat: "repeat", retake: "retake", pause: "silence" };

// The removed ranges are the gaps between kept segments. Each gets labelled by the words inside it.
export function buildCutList(a: Analysis, input?: string): CutList {
  const keep = keepSegments(a).map((s) => ({ start: r3(s.start), end: r3(s.end) }));
  const removed: Segment[] = [];
  let t = 0;
  for (const s of keep) {
    if (s.start - t > 0.01) removed.push({ start: t, end: s.start });
    t = s.end;
  }
  if (a.duration - t > 0.01) removed.push({ start: t, end: a.duration });
  if (!keep.length && a.duration > 0) removed.splice(0, removed.length, { start: 0, end: a.duration });

  const cuts: CutEntry[] = removed.map((g, gi) => {
    const inside = a.words
      .map((w, i) => ({ w, reason: a.cutIdx[i] }))
      .filter(({ w, reason }) => reason && w.start < g.end && w.end > g.start);
    const text = inside.map(({ w }) => w.text).join(" ");
    const top = PRIORITY.find((p) => inside.some((x) => x.reason === p));
    const dur = g.end - g.start;
    let reason: string;
    let type: CutType;
    if (top) {
      type = TYPE[top];
      // One clause per kind of cut in this range, most significant first.
      reason = PRIORITY.filter((p) => inside.some((x) => x.reason === p))
        .map((p) => {
          const ws = inside.filter((x) => x.reason === p).map((x) => x.w.text);
          const q = `"${ws.join(" ")}"`;
          return p === "filler" ? `filler word${ws.length > 1 ? "s" : ""} ${q}` : p === "repeat" ? `stutter / repeated ${q}` : `retake or false start ${q} (keeps the final take)`;
        })
        .join("; ");
    } else {
      type = "silence";
      reason =
        gi === 0 && g.start === 0
          ? `${r1(dur)}s of silence before the first word`
          : g.end >= a.duration - 0.001
            ? `${r1(dur)}s of silence after the last word`
            : `pause shortened by ${r1(dur)}s`;
    }
    return { start: r3(g.start), end: r3(g.end), duration: r3(dur), type, text, reason };
  });

  const after = keep.reduce((s, k) => s + (k.end - k.start), 0);
  return {
    input,
    durationBefore: r3(a.duration),
    durationAfter: r3(after),
    savedSec: r1(a.duration - after),
    savedPct: a.duration ? Math.round(((a.duration - after) / a.duration) * 100) : 0,
    score: a.score,
    fillersPerMin: a.fillersPerMin,
    counts: {
      fillers: a.fillerCount,
      repeats: a.repeatCount,
      retakes: a.retakeCount,
      silences: cuts.filter((c) => c.type === "silence").length,
    },
    deadAirSec: a.deadAirSec,
    keep,
    cuts,
    transcript: a.words.filter((_, i) => !a.cutIdx[i]).map((w) => w.text).join(" "),
  };
}

export async function checkFfmpeg() {
  for (const bin of ["ffmpeg", "ffprobe"]) {
    const ok = await new Promise<boolean>((resolve) => {
      const p = spawn(bin, ["-version"], { stdio: "ignore" });
      p.on("error", () => resolve(false));
      p.on("close", (code) => resolve(code === 0));
    });
    if (!ok)
      throw new Error(
        `${bin} was not found on your PATH. Umless needs ffmpeg (6.1+): macOS \`brew install ffmpeg\`, Ubuntu/Debian \`sudo apt install ffmpeg\`, Windows \`winget install ffmpeg\`.`,
      );
  }
}

async function preflight(input: string) {
  if (!process.env.OPENROUTER_API_KEY)
    throw new Error("OPENROUTER_API_KEY is not set. Get a key at https://openrouter.ai/keys (a 3-minute video costs about $0.02).");
  await checkFfmpeg();
  const file = path.resolve(input);
  const st = await fs.stat(file).catch(() => null);
  if (!st?.isFile()) throw new Error(`No such file: ${file}`);
  return file;
}

export type AnalyzeOptions = { retakes?: boolean; onStep?: (step: string) => void };

export async function analyzeFile(input: string, opts: AnalyzeOptions = {}) {
  const file = await preflight(input);
  const step = opts.onStep || (() => {});
  const { duration, hasVideo } = await probe(file);
  const work = await fs.mkdtemp(path.join(os.tmpdir(), "umless-"));
  try {
    step("extracting audio");
    const wav = path.join(work, "audio.wav");
    await extractAudio(file, wav);
    step("transcribing");
    const words = await transcribe(wav);
    step("finding fillers, stutters, retakes and pauses");
    const analysis = await analyze(words, duration, opts.retakes !== false);
    return { file, hasVideo, analysis, cutList: buildCutList(analysis, file) };
  } finally {
    await fs.rm(work, { recursive: true, force: true });
  }
}

export function defaultOutput(file: string, hasVideo: boolean) {
  return `${file.replace(/\.[^./\\]+$/, "")}.umless${hasVideo ? ".mp4" : ".m4a"}`;
}

export type CleanOptions = AnalyzeOptions & { out?: string; studioSound?: boolean };
export type CleanResult = {
  output: string;
  durationBefore: number;
  durationAfter: number;
  savedSec: number;
  savedPct: number;
  score: number;
  counts: CutList["counts"];
  deadAirSec: number;
  studioSound: boolean;
  cutList: CutList;
};

export async function cleanFile(input: string, opts: CleanOptions = {}): Promise<CleanResult> {
  const { file, hasVideo, analysis, cutList } = await analyzeFile(input, opts);
  const step = opts.onStep || (() => {});
  if (!cutList.keep.length) throw new Error("No speech found in this file, so there is nothing to keep.");
  const output = path.resolve(opts.out || defaultOutput(file, hasVideo));
  if (output === file) throw new Error("The output path must differ from the input path.");
  await fs.mkdir(path.dirname(output), { recursive: true });
  step("rendering");
  if (opts.studioSound) {
    const work = await fs.mkdtemp(path.join(os.tmpdir(), "umless-"));
    try {
      const cut = path.join(work, `cut${path.extname(output) || ".mp4"}`);
      await renderCut(file, keepSegments(analysis), cut, hasVideo);
      step("studio sound");
      await studioSound(cut, output, hasVideo, work);
    } finally {
      await fs.rm(work, { recursive: true, force: true });
    }
  } else {
    await renderCut(file, keepSegments(analysis), output, hasVideo);
  }
  const after = (await probe(output)).duration;
  const before = analysis.duration;
  return {
    output,
    durationBefore: r3(before),
    durationAfter: r3(after),
    savedSec: r1(before - after),
    savedPct: before ? Math.round(((before - after) / before) * 100) : 0,
    score: cutList.score,
    counts: cutList.counts,
    deadAirSec: cutList.deadAirSec,
    studioSound: !!opts.studioSound,
    cutList,
  };
}
