// Umless core pipeline: transcribe -> find ums, stutters, retakes, dead air -> cut -> optional studio sound / re-voice.
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

export type Word = { text: string; start: number; end: number };
export type Cut = { start: number; end: number; reason: "filler" | "repeat" | "retake" | "pause" };
export type Analysis = {
  duration: number;
  words: Word[];
  cutIdx: Record<number, Cut["reason"]>;
  fillerCount: number;
  repeatCount: number;
  retakeCount: number;
  deadAirSec: number;
  fillersPerMin: number;
  score: number; // 0-100, higher = cleaner delivery
  topFillers: [string, number][];
};
export type Segment = { start: number; end: number };

const FILLERS = new Set(["um", "umm", "uh", "uhh", "uhm", "erm", "er", "ah", "ahh", "hmm", "mm", "mhm", "eh"]);
const MAX_GAP = 0.45; // longest silence we keep between words
const KEEP_GAP = 0.25; // silence left behind when we shrink a long pause
const PAD = 0.04;

const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9']/g, "");

export function run(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args);
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(`${cmd} failed: ${err.slice(-800)}`))));
  });
}

export async function probe(file: string) {
  const out = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type", "-of", "json", file]);
  const j = JSON.parse(out);
  return {
    duration: Number(j.format.duration),
    hasVideo: (j.streams || []).some((s: { codec_type: string }) => s.codec_type === "video"),
  };
}

export async function extractAudio(input: string, outWav: string) {
  await run("ffmpeg", ["-y", "-loglevel", "error", "-i", input, "-vn", "-ac", "1", "-ar", "16000", outWav]);
}

// Every AI call goes through one OpenRouter key.
const OR = "https://openrouter.ai/api/v1";
const orHeaders = () => ({ Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "X-Title": "Umless" });
// AssemblyAI keeps every "um" and its word timings land within ~40 ms of ElevenLabs Scribe. ~$0.30/hour of audio.
const STT_MODEL = process.env.UMLESS_STT_MODEL || "assemblyai/universal-3-6-pro";
const LLM_MODEL = process.env.UMLESS_LLM_MODEL || "openai/gpt-5-mini";

export async function transcribe(wav: string): Promise<Word[]> {
  const form = new FormData();
  form.append("model", STT_MODEL);
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");
  form.append("file", new Blob([new Uint8Array(await fs.readFile(wav))], { type: "audio/wav" }), path.basename(wav));
  const res = await fetch(`${OR}/audio/transcriptions`, { method: "POST", headers: orHeaders(), body: form });
  if (!res.ok) throw new Error(`transcription failed: ${res.status} ${await res.text()}`);
  const j = await res.json();
  return ((j.words || []) as { word: string; start: number; end: number }[])
    .filter((w) => w.word?.trim())
    .map(({ word, start, end }) => ({ text: word.trim(), start, end }));
}

async function chatJSON(system: string, user: string) {
  const res = await fetch(`${OR}/chat/completions`, {
    method: "POST",
    headers: { ...orHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LLM_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`model call failed: ${res.status} ${await res.text()}`);
  return JSON.parse((await res.json()).choices[0].message.content);
}

// Asks a small model which words belong to false starts / "let me say that again" retakes.
async function findRetakes(words: Word[], already: Set<number>): Promise<number[]> {
  if (!process.env.OPENROUTER_API_KEY || words.length === 0) return [];
  const indexed = words.map((w, i) => `${i}:${w.text}`).join(" ");
  try {
    const j = await chatJSON(
      "You edit spoken video transcripts. Given indexed words, return JSON {\"delete\":[indices]} listing ONLY words that should be cut so the speech sounds like a clean first take: abandoned false starts, self-corrections where the speaker restarts a phrase, and meta-talk like 'sorry, let me say that again'. Keep the final, completed version of any restarted phrase. Be conservative: never delete content the speaker meant to say. Filler words like um/uh are handled separately; you may ignore them.",
      indexed,
    );
    const del: number[] = j.delete || [];
    return del.filter((i) => Number.isInteger(i) && i >= 0 && i < words.length && !already.has(i));
  } catch {
    return [];
  }
}

export async function analyze(words: Word[], duration: number, useAI = true): Promise<Analysis> {
  const cutIdx: Record<number, Cut["reason"]> = {};
  const counts = new Map<string, number>();

  words.forEach((w, i) => {
    const n = norm(w.text);
    if (FILLERS.has(n)) {
      cutIdx[i] = "filler";
      counts.set(n, (counts.get(n) || 0) + 1);
    }
  });

  // Immediate repeats of 1-4 word phrases ("I'm gonna, I'm gonna", "the the"), ignoring fillers in between.
  const content = words.map((w, i) => ({ n: norm(w.text), i })).filter((x) => !cutIdx[x.i] && x.n);
  for (let k = 0; k < content.length; k++) {
    for (let len = 4; len >= 1; len--) {
      if (k + 2 * len > content.length) continue;
      const a = content.slice(k, k + len).map((x) => x.n).join(" ");
      const b = content.slice(k + len, k + 2 * len).map((x) => x.n).join(" ");
      if (a === b && !content.slice(k, k + len).some((x) => cutIdx[x.i])) {
        content.slice(k, k + len).forEach((x) => (cutIdx[x.i] = "repeat"));
        break;
      }
    }
  }

  if (useAI) {
    for (const i of await findRetakes(words, new Set(Object.keys(cutIdx).map(Number)))) cutIdx[i] = "retake";
  }

  // Dead air = silence where nobody is speaking at all (cut words count as speech here).
  let deadAir = 0;
  for (let k = 1; k < words.length; k++) {
    const gap = words[k].start - words[k - 1].end;
    if (gap > MAX_GAP) deadAir += gap - KEEP_GAP;
  }
  if (words.length) deadAir += Math.max(0, words[0].start - 0.2) + Math.max(0, duration - words[words.length - 1].end - 0.3);

  const reasons = Object.values(cutIdx);
  const fillerCount = reasons.filter((r) => r === "filler").length;
  const repeatCount = reasons.filter((r) => r === "repeat").length;
  const retakeCount = reasons.filter((r) => r === "retake").length;
  const minutes = Math.max(duration / 60, 0.1);
  const fillersPerMin = fillerCount / minutes;
  // Calibrated so a polished speaker lands ~90+, a typical nervous one-take demo ~40-60.
  const penalty = fillersPerMin * 2.5 + ((repeatCount + retakeCount) / minutes) * 1 + (deadAir / duration) * 50;
  return {
    duration,
    words,
    cutIdx,
    fillerCount,
    repeatCount,
    retakeCount,
    deadAirSec: Math.round(deadAir * 10) / 10,
    fillersPerMin: Math.round(fillersPerMin * 10) / 10,
    score: Math.max(0, Math.min(100, Math.round(100 - penalty))),
    topFillers: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3),
  };
}

// Turns the kept words into time ranges to keep, shrinking long pauses.
export function keepSegments(a: Analysis): Segment[] {
  const kept = a.words.filter((_, i) => !a.cutIdx[i]);
  if (!kept.length) return [];
  const segs: Segment[] = [];
  let cur: Segment = { start: Math.max(0, kept[0].start - PAD), end: kept[0].end + PAD };
  for (let k = 1; k < kept.length; k++) {
    const prev = kept[k - 1];
    const w = kept[k];
    const removedBetween = a.words.some((x, i) => a.cutIdx[i] && x.start >= prev.end - 0.01 && x.end <= w.start + 0.01);
    const gap = w.start - prev.end;
    if (!removedBetween && gap <= MAX_GAP) {
      cur.end = w.end + PAD;
    } else {
      const keepEach = Math.min(gap, removedBetween ? 0.18 : KEEP_GAP) / 2;
      cur.end = prev.end + keepEach;
      segs.push(cur);
      cur = { start: w.start - keepEach, end: w.end + PAD };
    }
  }
  cur.end = Math.min(cur.end + 0.25, a.duration);
  segs.push(cur);
  return segs.filter((s) => s.end - s.start > 0.05);
}

// Word timings can be off by ~50 ms, which leaves the tail of a cut "uh" behind. Move every cut
// boundary to the quietest 10 ms within ±70 ms of where the transcript put it.
export async function snapToSilence(input: string, segs: Segment[]): Promise<Segment[]> {
  const pcm = await new Promise<Buffer>((resolve, reject) => {
    const p = spawn("ffmpeg", ["-loglevel", "error", "-i", input, "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"]);
    const chunks: Buffer[] = [];
    p.stdout.on("data", (d) => chunks.push(d));
    p.on("close", (code) => (code === 0 ? resolve(Buffer.concat(chunks)) : reject(new Error("ffmpeg audio read failed"))));
  });
  const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 2));
  const frame = 160; // 10 ms
  const rms: number[] = [];
  for (let i = 0; i + frame <= samples.length; i += frame) {
    let s = 0;
    for (let j = i; j < i + frame; j++) s += samples[j] * samples[j];
    rms.push(Math.sqrt(s / frame));
  }
  const quietest = (t: number) => {
    const c = Math.round(t * 100);
    let best = c;
    for (let f = Math.max(0, c - 7); f <= Math.min(rms.length - 1, c + 7); f++) if (rms[f] < rms[best] - 1) best = f;
    return best / 100;
  };
  return segs.map((s, i) => ({
    start: i === 0 ? s.start : quietest(s.start),
    end: i === segs.length - 1 ? s.end : quietest(s.end),
  })).filter((s) => s.end - s.start > 0.05);
}

// Cuts video+audio (or audio only) down to the kept segments with tiny fades to avoid clicks.
export async function renderCut(input: string, rawSegs: Segment[], out: string, hasVideo: boolean) {
  const segs = await snapToSilence(input, rawSegs);
  const parts: string[] = [];
  const labels: string[] = [];
  segs.forEach((s, i) => {
    const d = (s.end - s.start).toFixed(3);
    const st = s.start.toFixed(3);
    const en = s.end.toFixed(3);
    if (hasVideo) parts.push(`[0:v]trim=start=${st}:end=${en},setpts=PTS-STARTPTS[v${i}]`);
    parts.push(
      `[0:a]atrim=start=${st}:end=${en},asetpts=PTS-STARTPTS,afade=t=in:d=0.015,afade=t=out:st=${Math.max(0, Number(d) - 0.015).toFixed(3)}:d=0.015[a${i}]`,
    );
    labels.push(hasVideo ? `[v${i}][a${i}]` : `[a${i}]`);
  });
  parts.push(`${labels.join("")}concat=n=${segs.length}:v=${hasVideo ? 1 : 0}:a=1${hasVideo ? "[v]" : ""}[a]`);
  const graphFile = out + ".filter.txt";
  await fs.writeFile(graphFile, parts.join(";\n"));
  const args = ["-y", "-loglevel", "error", "-i", input, "-/filter_complex", graphFile];
  if (hasVideo) args.push("-map", "[v]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p");
  args.push("-map", "[a]", "-c:a", "aac", "-b:a", "192k", out);
  await run("ffmpeg", args);
  await fs.rm(graphFile, { force: true });
}

// Studio Sound, done locally with ffmpeg (free): rumble cut, broadband denoise, gentle compression.
// mux() then loudness-normalises to -16 LUFS.
export async function studioSound(input: string, out: string, hasVideo: boolean, workDir: string) {
  const wav = path.join(workDir, "studio.wav");
  await run("ffmpeg", [
    "-y", "-loglevel", "error", "-i", input, "-vn", "-ac", "1", "-ar", "48000",
    "-af", "highpass=f=80,lowpass=f=14000,afftdn=nr=12:nf=-30:tn=1,acompressor=threshold=-21dB:ratio=3:attack=5:release=120:makeup=2",
    wav,
  ]);
  await mux(input, wav, out, hasVideo);
  await fs.rm(wav, { force: true });
}

async function mux(videoSrc: string, audio: string, out: string, hasVideo: boolean) {
  const args = ["-y", "-loglevel", "error", "-i", videoSrc, "-i", audio];
  if (hasVideo) args.push("-map", "0:v", "-c:v", "copy");
  args.push("-map", "1:a", "-c:a", "aac", "-b:a", "192k", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-shortest", out);
  await run("ffmpeg", args);
}

// Re-voice: polish each sentence, speak it with a clean voice, and stretch the matching video to fit.
export type Sentence = { start: number; end: number; original: string; polished: string };

export function sentences(a: Analysis): Sentence[] {
  const out: Sentence[] = [];
  let buf: Word[] = [];
  a.words.forEach((w, i) => {
    if (a.cutIdx[i]) return;
    buf.push(w);
    if (/[.!?]$/.test(w.text) || buf.length >= 30) {
      out.push({ start: buf[0].start, end: buf[buf.length - 1].end, original: buf.map((x) => x.text).join(" "), polished: "" });
      buf = [];
    }
  });
  if (buf.length) out.push({ start: buf[0].start, end: buf[buf.length - 1].end, original: buf.map((x) => x.text).join(" "), polished: "" });
  // One- or two-word lines ("Thanks.") come back clipped from TTS, so fold them into a neighbour.
  const merged: Sentence[] = [];
  for (const s of out) {
    const prev = merged[merged.length - 1];
    const short = (x: Sentence) => x.original.split(" ").length < 4;
    if (prev && (short(s) || short(prev)) && prev.original.split(" ").length < 30) {
      prev.end = s.end;
      prev.original += " " + s.original;
    } else merged.push({ ...s });
  }
  return merged;
}

export async function polish(sents: Sentence[]): Promise<Sentence[]> {
  const j = await chatJSON(
    "You clean up lines from a spoken product demo so they read as confident, natural speech. Fix grammar and dangling commas left by removed filler words, keep the speaker's meaning, words and tone, keep length within 15% of the original. Return JSON {\"lines\":[...]} with exactly one output line per input line, same order.",
    JSON.stringify(sents.map((s) => s.original)),
  );
  const lines: string[] = j.lines || [];
  return sents.map((s, i) => ({ ...s, polished: lines[i] || s.original }));
}

// Voices. "clone" sends a short sample of the speaker's own cleaned audio with every request (HeyGen Voice,
// stateless cloning), so no voice is ever stored anywhere. "stock" is a ready-made Gemini voice.
export type Voice = { kind: "clone"; ref: string } | { kind: "stock"; id: string };
const CLONE_MODELS = ["heygen/heygen-voice-1-turbo:free", "heygen/heygen-voice-1-turbo", "heygen/heygen-voice-1"];
const STOCK_MODEL = "google/gemini-3.8-flash-tts";

// 15 s from the middle of the cleaned take: no ums in it, and past any slow start.
export async function voiceSample(cleanMedia: string, workDir: string): Promise<Voice> {
  const { duration } = await probe(cleanMedia);
  const len = Math.min(15, duration);
  const start = Math.max(0, Math.min(duration - len, duration / 2 - len / 2));
  const ref = path.join(workDir, "voice_ref.wav");
  await run("ffmpeg", ["-y", "-loglevel", "error", "-ss", start.toFixed(2), "-t", len.toFixed(2), "-i", cleanMedia, "-vn", "-ac", "1", "-ar", "24000", ref]);
  return { kind: "clone", ref };
}

async function tts(body: Record<string, unknown>) {
  const res = await fetch(`${OR}/audio/speech`, {
    method: "POST",
    headers: { ...orHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, response_format: "pcm" }),
  });
  if (!res.ok) throw new Error(`voice failed: ${res.status} ${await res.text()}`);
  const rate = Number(/rate=(\d+)/.exec(res.headers.get("content-type") || "")?.[1] || 24000);
  return { pcm: Buffer.from(await res.arrayBuffer()), rate };
}

// Writes a WAV of `text` spoken in `voice` to `out`.
export async function speak(text: string, out: string, voice: Voice) {
  let result: { pcm: Buffer; rate: number } | null = null;
  if (voice.kind === "clone") {
    const data = "data:audio/wav;base64," + (await fs.readFile(voice.ref)).toString("base64");
    let lastErr: unknown;
    for (const model of CLONE_MODELS) {
      try {
        result = await tts({ model, input: text, input_references: [{ type: "input_audio", input_audio: { data } }] });
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!result) throw lastErr;
  } else {
    result = await tts({ model: STOCK_MODEL, input: text, voice: voice.id, instructions: "Confident, warm, clear product-demo narration. Natural pace." });
  }
  const raw = out + ".pcm";
  await fs.writeFile(raw, result.pcm);
  await run("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", String(result.rate), "-ac", "1", "-i", raw, out]);
  await fs.rm(raw, { force: true });
}

export async function renderRevoice(
  input: string,
  sents: Sentence[],
  duration: number,
  hasVideo: boolean,
  voice: Voice,
  workDir: string,
  out: string,
) {
  // Timeline pieces: each sentence (stretched to its new voice line) plus short gaps between sentences.
  type Piece = { srcStart: number; srcEnd: number; audio?: string; outDur: number };
  const pieces: Piece[] = [];
  for (let i = 0; i < sents.length; i++) {
    const s = sents[i];
    const file = path.join(workDir, `line_${i}.wav`);
    await speak(s.polished, file, voice);
    const d = (await probe(file)).duration;
    const srcStart = i === 0 ? Math.max(0, s.start - 0.1) : s.start;
    const srcEnd = i === sents.length - 1 ? Math.min(duration, s.end + 0.3) : sents[i + 1].start;
    const gap = 0.3;
    pieces.push({ srcStart, srcEnd, audio: file, outDur: d + gap });
  }
  const parts: string[] = [];
  const v: string[] = [];
  const a: string[] = [];
  pieces.forEach((p, i) => {
    const srcDur = p.srcEnd - p.srcStart;
    const factor = Math.min(3, Math.max(0.33, p.outDur / srcDur));
    if (hasVideo)
      parts.push(
        `[0:v]trim=start=${p.srcStart.toFixed(3)}:end=${p.srcEnd.toFixed(3)},setpts=(PTS-STARTPTS)*${factor.toFixed(4)},tpad=stop_mode=clone:stop_duration=5,trim=duration=${p.outDur.toFixed(3)}[v${i}]`,
      );
    parts.push(`[${i + 1}:a]aresample=44100,aformat=channel_layouts=mono,apad=whole_dur=${p.outDur.toFixed(3)}[a${i}]`);
    v.push(`[v${i}]`);
    a.push(`[a${i}]`);
  });
  if (hasVideo) parts.push(`${v.join("")}concat=n=${pieces.length}:v=1:a=0[v]`);
  parts.push(`${a.join("")}concat=n=${pieces.length}:v=0:a=1[a]`);
  const graphFile = out + ".filter.txt";
  await fs.writeFile(graphFile, parts.join(";\n"));
  const args = ["-y", "-loglevel", "error", "-i", input];
  pieces.forEach((p) => args.push("-i", p.audio!));
  args.push("-/filter_complex", graphFile);
  if (hasVideo) args.push("-map", "[v]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p");
  args.push("-map", "[a]", "-c:a", "aac", "-b:a", "192k", out);
  await run("ffmpeg", args);
  await fs.rm(graphFile, { force: true });
}
