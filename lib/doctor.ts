// `umless doctor`: one command that says what is missing before a render fails halfway through (#17).
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkLocalWhisper } from "./whisper";

export type DoctorReport = {
  ffmpeg: { ok: boolean; version?: string };
  key: { ok: boolean };
  tmp: { ok: boolean };
  whisper: { ok: boolean };
};

/** "ffmpeg version 6.1.1-3ubuntu5 Copyright ..." -> "6.1.1"; also "n7.0", "N-112345-g..." builds. */
export function parseFfmpegVersion(out: string): string | undefined {
  const m = out.match(/ffmpeg version n?([0-9][\w.]*|N-\d+)/);
  return m?.[1];
}

/** Transcription works with a key (cloud) or with whisper.cpp (local); UMLESS_STT=local needs whisper. */
export function doctorOk(r: DoctorReport, forceLocal = process.env.UMLESS_STT === "local"): boolean {
  const stt = forceLocal ? r.whisper.ok : r.key.ok || r.whisper.ok;
  return r.ffmpeg.ok && r.tmp.ok && stt;
}

/** The ✓/✗ checklist. Never includes the key's value, only whether it is set. */
export function doctorLines(r: DoctorReport, forceLocal = process.env.UMLESS_STT === "local"): string[] {
  const mark = (ok: boolean) => (ok ? "✓" : "✗");
  const lines = [
    `${mark(r.ffmpeg.ok)} ffmpeg ${r.ffmpeg.ok ? r.ffmpeg.version || "(version unknown)" : "not found on PATH"}`,
    `${mark(r.key.ok)} OPENROUTER_API_KEY ${r.key.ok ? "is set" : "is not set"}`,
    `${mark(r.whisper.ok)} whisper.cpp (local transcription) ${r.whisper.ok ? "found" : "not found"}`,
    `${mark(r.tmp.ok)} temp dir ${os.tmpdir()} ${r.tmp.ok ? "is writable" : "is not writable"}`,
  ];
  const hints: string[] = [];
  if (!r.ffmpeg.ok)
    hints.push("Install ffmpeg (6.1+): macOS `brew install ffmpeg`, Ubuntu/Debian `sudo apt install ffmpeg`, Windows `winget install ffmpeg`.");
  if (forceLocal && !r.whisper.ok)
    hints.push("UMLESS_STT=local needs whisper.cpp: run scripts/setup-local-whisper.sh, or unset UMLESS_STT and set OPENROUTER_API_KEY.");
  else if (!r.key.ok && !r.whisper.ok)
    hints.push("No transcription available: set OPENROUTER_API_KEY (https://openrouter.ai/keys) or install whisper.cpp (scripts/setup-local-whisper.sh).");
  if (!r.tmp.ok) hints.push("Point TMPDIR at a writable directory.");
  return hints.length ? [...lines, "", ...hints] : lines;
}

function ffmpegVersion(): Promise<string | undefined | null> {
  return new Promise((resolve) => {
    let out = "";
    const p = spawn("ffmpeg", ["-version"], { stdio: ["ignore", "pipe", "ignore"] });
    p.stdout.on("data", (d) => (out += d));
    p.on("error", () => resolve(null));
    p.on("close", (code) => resolve(code === 0 ? parseFfmpegVersion(out) : null));
  });
}

async function tmpWritable(): Promise<boolean> {
  try {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "umless-doctor-"));
    await fs.writeFile(path.join(dir, "probe"), "ok");
    await fs.rm(dir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

export async function runDoctor(): Promise<DoctorReport> {
  const [version, tmp, whisper] = await Promise.all([
    ffmpegVersion(),
    tmpWritable(),
    checkLocalWhisper().then(() => true, () => false),
  ]);
  return {
    ffmpeg: version === null ? { ok: false } : { ok: true, ...(version ? { version } : {}) },
    key: { ok: Boolean(process.env.OPENROUTER_API_KEY?.trim()) },
    tmp: { ok: tmp },
    whisper: { ok: whisper },
  };
}
