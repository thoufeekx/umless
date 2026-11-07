// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { addMissedFillers, analyze, isFiller, keepSegments, type Word } from "./pipeline";

// 10 ms RMS frames: quiet room tone everywhere, loud where `loud` says.
function level(seconds: number, loud: [number, number][]): number[] {
  return Array.from({ length: Math.round(seconds * 100) }, (_, f) =>
    loud.some(([s, e]) => f / 100 >= s && f / 100 < e) ? 3000 : 100,
  );
}
const w = (text: string, start: number, end: number): Word => ({ text, start, end });

// "So I [um] think so": the main transcript skipped the um between 1.0 and 1.8 s.
const words = [w("So", 0.2, 0.4), w("I", 0.45, 0.6), w("think", 1.9, 2.2), w("so.", 2.25, 2.5)];
const speech: [number, number][] = [[0.2, 0.6], [1.2, 1.55], [1.9, 2.5]];

test("isFiller normalises case and punctuation", () => {
  assert.ok(isFiller("Um,"));
  assert.ok(isFiller("uh..."));
  assert.ok(!isFiller("umbrella"));
});

test("a hinted filler is placed on the loud audio inside the gap, not on the hint's own timing", () => {
  const out = addMissedFillers(words, [w("um", 1.0, 1.3)], level(3, speech));
  const um = out.find((x) => x.text === "um");
  assert.ok(um);
  assert.ok(Math.abs(um.start - 1.2) < 0.03 && Math.abs(um.end - 1.55) < 0.03, `got ${um.start}-${um.end}`);
  assert.equal(out.length, words.length + 1);
});

test("a hint over a real word, a silent gap or a too-short gap adds nothing", () => {
  const rms = level(3, speech);
  assert.equal(addMissedFillers(words, [w("uh", 1.95, 2.1)], rms).length, words.length); // inside "think"
  assert.equal(addMissedFillers(words, [w("uh", 1.0, 1.1)], level(3, [[0.2, 0.6], [1.9, 2.5]])).length, words.length); // gap is silent
  assert.equal(addMissedFillers(words, [w("uh", 0.4, 0.45)], rms).length, words.length); // 50 ms gap between "So" and "I"
});

test("non-filler hints and fillers the main transcript already has are ignored", () => {
  const rms = level(3, speech);
  assert.equal(addMissedFillers(words, [w("maybe", 1.2, 1.5)], rms).length, words.length);
  const withUm = [...words, w("um", 1.2, 1.55)].sort((a, b) => a.start - b.start);
  assert.equal(addMissedFillers(withUm, [w("Um,", 1.1, 1.4)], rms).length, withUm.length);
});

test("an added filler is counted and cut, and the real words around it are kept", async () => {
  const out = addMissedFillers(words, [w("um", 1.0, 1.3)], level(3, speech));
  const a = await analyze(out, 3, false);
  assert.equal(a.fillerCount, 1);
  const segs = keepSegments(a);
  const kept = (t: number) => segs.some((s) => t >= s.start && t <= s.end);
  assert.ok(!kept(1.35), "um audio should be cut");
  for (const x of words) assert.ok(kept((x.start + x.end) / 2), `"${x.text}" should be kept`);
});
