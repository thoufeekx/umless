#!/usr/bin/env -S npx tsx
// Open-source Umless CLI: cut ums, stutters, retakes and dead air from any video. Bring your own OpenRouter key (about $0.02 per 3-minute video),
// or run fully local with whisper.cpp (no key).
// Re-voicing in your own voice lives in the hosted app: https://umless.app
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { parseCliArgs } from "../lib/cliargs";
import { analyze, extractAudio, keepSegments, probe, renderCut, transcribe } from "../lib/pipeline";
import { checkLocalWhisper, useLocalStt } from "../lib/whisper";

async function main() {
  const { input, output, score } = parseCliArgs(process.argv.slice(2));
  if (!input) {
    console.log(
      "usage: umless <video|audio> [--score] [-o|--output <path>]\n" +
        "  -o, --output <path>  where to write the cleaned file (default: <name>.umless.mp4 / .m4a next to the input).\n" +
        "  With OPENROUTER_API_KEY set (https://openrouter.ai/keys): cloud transcription + retake detection.\n" +
        "  Without it (or UMLESS_STT=local): free local transcription with whisper.cpp.",
    );
    process.exit(1);
  }
  if (output && path.resolve(output) === path.resolve(input))
    throw new Error("The output path must differ from the input path.");
  if (useLocalStt()) await checkLocalWhisper();
  const { duration, hasVideo } = await probe(input);
  const base = input.replace(/\.[^.]+$/, "");
  const wav = `${base}.umless.wav`;
  await extractAudio(input, wav);
  const words = await transcribe(wav);
  const a = await analyze(words, duration);
  console.log(`Um Score ${a.score}/100 · ${a.fillersPerMin} ums/min · ${a.repeatCount + a.retakeCount} stutters & retakes · ${a.deadAirSec}s dead air`);
  console.log(words.map((w, i) => (a.cutIdx[i] ? `\x1b[9;31m${w.text}\x1b[0m` : w.text)).join(" "));
  if (!score) {
    const out = output ? path.resolve(output) : `${base}.umless${hasVideo ? ".mp4" : ".m4a"}`;
    await mkdir(path.dirname(out), { recursive: true });
    await renderCut(input, keepSegments(a), out, hasVideo);
    const d = (await probe(out)).duration;
    console.log(`\n✓ ${output ? out : path.basename(out)}  ${duration.toFixed(1)}s → ${d.toFixed(1)}s`);
    console.log("Want it re-recorded in your own voice, no stumbles? → https://umless.app");
  }
  await rm(wav, { force: true });
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
