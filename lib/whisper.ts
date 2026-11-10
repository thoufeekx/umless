// Local transcription with whisper.cpp: free, no API key. Used when UMLESS_STT=local or OPENROUTER_API_KEY is unset.
// Audio never leaves the machine on this path.
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Word } from "./pipeline";

// Whisper tends to "clean up" disfluencies. Priming it with a disfluent prompt makes it write the ums down.
export const WHISPER_PROMPT = "Umm, uh, so, like, I mean, you know, er... Um, I, I think, uh, yeah.";

export const whisperBin = () => process.env.UMLESS_WHISPER_BIN || "whisper-cli";
export const whisperModel = () =>
  (process.env.UMLESS_WHISPER_MODEL || "~/.cache/umless/ggml-base.en.bin").replace(/^~(?=\/|$)/, os.homedir());

export function useLocalStt(): boolean {
  return process.env.UMLESS_STT === "local" || !process.env.OPENROUTER_API_KEY;
}

const INSTALL_HELP = [
  "Local transcription needs whisper.cpp and a model. Install them with:",
  "  git clone --depth 1 https://github.com/ggml-org/whisper.cpp ~/whisper.cpp",
  "  cmake -S ~/whisper.cpp -B ~/whisper.cpp/build -DCMAKE_BUILD_TYPE=Release",
  "  cmake --build ~/whisper.cpp/build -j2 --config Release --target whisper-cli",
  "  mkdir -p ~/.cache/umless && curl -L -o ~/.cache/umless/ggml-base.en.bin \\",
  "    https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin",
  "  export UMLESS_WHISPER_BIN=~/whisper.cpp/build/bin/whisper-cli",
  "(or run scripts/setup-local-whisper.sh from the umless repo; on macOS `brew install whisper-cpp` also gives you whisper-cli).",
  "Or set OPENROUTER_API_KEY to use cloud transcription instead (https://openrouter.ai/keys).",
].join("\n");

// Throws a readable error with install commands if the binary or model is missing.
export async function checkLocalWhisper(): Promise<void> {
  const bin = whisperBin();
  const ok = await new Promise<boolean>((resolve) => {
    const p = spawn(bin, ["--help"], { stdio: "ignore" });
    p.on("error", () => resolve(false));
    p.on("close", () => resolve(true));
  });
  if (!ok) throw new Error(`whisper.cpp binary not found: "${bin}" (set UMLESS_WHISPER_BIN).\n${INSTALL_HELP}`);
  const model = whisperModel();
  if (!(await fs.stat(model).catch(() => null))?.isFile())
    throw new Error(`whisper model not found: ${model} (set UMLESS_WHISPER_MODEL).\n${INSTALL_HELP}`);
}

type WhisperToken = { text: string; offsets?: { from: number; to: number }; t_dtw?: number };
type WhisperSegment = { text: string; offsets: { from: number; to: number }; tokens?: WhisperToken[] };

const keepWord = (w: Word) =>
  w.end >= w.start &&
  !/^[[(].*[\])]$/.test(w.text) && // [BLANK_AUDIO], (music), [Music]
  /[\p{L}\p{N}]/u.test(w.text); // bare punctuation

// Parses whisper.cpp JSON output into words (seconds). Two shapes:
// - `-ojf -dtw <model>`: tokens carry `t_dtw` (centiseconds), a word-onset time that is accurate to ~50 ms. Words are
//   built from tokens (a token starting with a space starts a new word); each word runs until the next word starts.
//   Those spans still include any pause after the word; tightenToSpeech() in pipeline.ts trims them to the audio.
// - `-oj -ml 1 -sow` (fallback): one segment per word with `offsets` in ms. Timings are loose (often 0.5 s+ off).
export function parseWhisperJson(j: { transcription?: WhisperSegment[] }): Word[] {
  const segs = j.transcription || [];
  const hasDtw = segs.some((s) => (s.tokens || []).some((t) => (t.t_dtw ?? -1) >= 0));
  if (!hasDtw) {
    return segs
      .map((s) => ({ text: (s.text || "").trim(), start: s.offsets.from / 1000, end: s.offsets.to / 1000 }))
      .filter(keepWord);
  }
  const words: { text: string; start: number; segEnd: number }[] = [];
  for (const s of segs) {
    for (const t of s.tokens || []) {
      if (/^\[_/.test(t.text)) continue; // [_BEG_], [_TT_123] and other special tokens
      const at = (t.t_dtw ?? -1) >= 0 ? t.t_dtw! / 100 : (t.offsets?.from ?? s.offsets.from) / 1000;
      const last = words[words.length - 1];
      if (!last || /^\s/.test(t.text)) words.push({ text: t.text.trim(), start: at, segEnd: s.offsets.to / 1000 });
      else last.text += t.text;
    }
  }
  const LEAD = 0.08; // DTW onsets land a little after the word really starts
  const MAX_WORD = 1.5;
  return words
    .map((w, i) => {
      const prevStart = i > 0 ? words[i - 1].start : 0;
      const start = Math.max(prevStart, w.start - LEAD);
      const next = words[i + 1];
      const end = Math.min(next ? Math.max(next.start - LEAD, start) : w.segEnd, start + MAX_WORD);
      return { text: w.text, start, end: Math.max(end, start) };
    })
    .filter(keepWord);
}

// "ggml-base.en.bin" -> "base.en" (the DTW alignment-head preset whisper.cpp expects), if it is a known one.
export function dtwPreset(model: string): string | null {
  if (process.env.UMLESS_WHISPER_DTW) return process.env.UMLESS_WHISPER_DTW === "off" ? null : process.env.UMLESS_WHISPER_DTW;
  const m = /ggml-(tiny|base|small|medium|large-v[123](?:-turbo)?)(\.en)?(?:-q\w+)?\.bin$/.exec(path.basename(model));
  return m ? m[1].replace(/-/g, ".") + (m[2] || "") : null;
}

function runWhisper(args: string[]): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const p = spawn(whisperBin(), args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`whisper.cpp failed (${code}): ${err.slice(-800)}`))));
  });
}

export async function whisperWords(wav: string): Promise<Word[]> {
  await checkLocalWhisper();
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "umless-whisper-"));
  const outBase = path.join(dir, "out");
  const model = whisperModel();
  const threads = String(Number(process.env.UMLESS_WHISPER_THREADS) || Math.min(4, os.cpus().length || 1));
  const common = ["-m", model, "-f", wav, "-t", threads, "--prompt", WHISPER_PROMPT, "-of", outBase, "-np"];
  const preset = dtwPreset(model);
  try {
    try {
      if (!preset) throw new Error("no DTW preset for this model");
      // DTW token timestamps need flash attention off (-nfa).
      await runWhisper([...common, "-nfa", "-dtw", preset, "-ojf"]);
    } catch {
      await runWhisper([...common, "-ml", "1", "-sow", "-oj"]); // older builds / custom models: per-word segments
    }
    return parseWhisperJson(JSON.parse(await fs.readFile(outBase + ".json", "utf8")));
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}
