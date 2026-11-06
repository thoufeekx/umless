// Usage: npm run pipeline -- <input> [cut|studio|revoice]
import { promises as fs } from "node:fs";
import path from "node:path";
import { analyze, extractAudio, keepSegments, polish, probe, renderCut, renderRevoice, sentences, studioSound, transcribe, voiceSample, Word } from "../lib/pipeline";

async function main() {
  const [input, mode = "cut"] = process.argv.slice(2);
  const dir = path.join(path.dirname(input), "out");
  await fs.mkdir(dir, { recursive: true });
  const { duration, hasVideo } = await probe(input);
  const cache = path.join(dir, path.basename(input) + ".words.json");
  let words: Word[];
  try {
    words = JSON.parse(await fs.readFile(cache, "utf8"));
  } catch {
    const wav = path.join(dir, "in.wav");
    await extractAudio(input, wav);
    words = await transcribe(wav);
    await fs.writeFile(cache, JSON.stringify(words));
  }
  const a = await analyze(words, duration);
  console.log({ score: a.score, fillers: a.fillerCount, repeats: a.repeatCount, retakes: a.retakeCount, deadAir: a.deadAirSec, perMin: a.fillersPerMin, top: a.topFillers });
  console.log("CUT:", words.map((w, i) => (a.cutIdx[i] ? `[${w.text}]` : w.text)).join(" "));
  const segs = keepSegments(a);
  const ext = hasVideo ? ".mp4" : ".m4a";
  const cut = path.join(dir, "clean" + ext);
  await renderCut(input, segs, cut, hasVideo);
  console.log("clean:", cut, (await probe(cut)).duration.toFixed(1), "s from", duration.toFixed(1));
  if (mode === "studio") {
    const out = path.join(dir, "clean_studio" + ext);
    await studioSound(cut, out, hasVideo, dir);
    console.log("studio:", out);
  }
  if (mode === "revoice") {
    const sents = await polish(sentences(a));
    sents.forEach((s) => console.log(" -", s.original, "=>", s.polished));
    const out = path.join(dir, "revoiced" + ext);
    const voice = process.env.VOICE ? { kind: "stock" as const, id: process.env.VOICE } : await voiceSample(cut, dir);
    await renderRevoice(input, sents, duration, hasVideo, voice, dir, out);
    console.log("revoiced:", out, (await probe(out)).duration.toFixed(1), "s");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
