#!/usr/bin/env -S npx tsx
// Open-source Umless CLI: cut ums, stutters, retakes and dead air from any video. Bring your own OpenRouter key (about $0.02 per 3-minute video).
// Re-voicing in your own voice lives in the hosted app: https://umless.app
import path from "node:path";
import { analyze, extractAudio, keepSegments, probe, renderCut, transcribe } from "../lib/pipeline";

async function main() {
  const [input, ...flags] = process.argv.slice(2);
  if (!input || !process.env.OPENROUTER_API_KEY) {
    console.log("usage: OPENROUTER_API_KEY=... umless <video|audio> [--score]\n  Get a key at https://openrouter.ai/keys");
    process.exit(1);
  }
  const { duration, hasVideo } = await probe(input);
  const base = input.replace(/\.[^.]+$/, "");
  const wav = `${base}.umless.wav`;
  await extractAudio(input, wav);
  const words = await transcribe(wav);
  const a = await analyze(words, duration);
  console.log(`Um Score ${a.score}/100 · ${a.fillersPerMin} ums/min · ${a.repeatCount + a.retakeCount} stutters & retakes · ${a.deadAirSec}s dead air`);
  console.log(words.map((w, i) => (a.cutIdx[i] ? `\x1b[9;31m${w.text}\x1b[0m` : w.text)).join(" "));
  if (!flags.includes("--score")) {
    const out = `${base}.umless${hasVideo ? ".mp4" : ".m4a"}`;
    await renderCut(input, keepSegments(a), out, hasVideo);
    const d = (await probe(out)).duration;
    console.log(`\n✓ ${path.basename(out)}  ${duration.toFixed(1)}s → ${d.toFixed(1)}s`);
    console.log("Want it re-recorded in your own voice, no stumbles? → https://umless.app");
  }
  await import("node:fs/promises").then((fs) => fs.rm(wav, { force: true }));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
