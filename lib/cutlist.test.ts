import assert from "node:assert/strict";
import { test } from "node:test";
import { buildCutJson, buildCutList, defaultOutput } from "./cutlist";
import { analyze, type Word } from "./pipeline";

const w = (text: string, start: number, end: number): Word => ({ text, start, end });

// "So um this is the the demo. [2 s pause] Thanks." with 1 s of silence before and after.
const words = [
  w("So", 1.0, 1.2),
  w("um", 1.3, 1.6),
  w("this", 1.7, 1.9),
  w("is", 1.95, 2.05),
  w("the", 2.1, 2.2),
  w("the", 2.25, 2.35),
  w("demo.", 2.4, 2.8),
  w("Thanks.", 4.8, 5.2),
];
const DURATION = 6.2;

test("cut list labels fillers, repeats and silences with timestamps and reasons", async () => {
  const a = await analyze(words, DURATION, false);
  const cl = buildCutList(a, "/tmp/in.mp4");

  assert.equal(cl.input, "/tmp/in.mp4");
  assert.equal(cl.durationBefore, 6.2);
  assert.equal(cl.counts.fillers, 1);
  assert.equal(cl.counts.repeats, 1);
  assert.equal(cl.counts.retakes, 0);

  const filler = cl.cuts.find((c) => c.type === "filler");
  assert.ok(filler, "has a filler cut");
  assert.equal(filler.text, "um");
  assert.equal(filler.reason, `filler word "um"`);
  assert.ok(filler.start <= 1.3 && filler.end >= 1.6, "filler cut covers the um");

  const repeat = cl.cuts.find((c) => c.type === "repeat");
  assert.ok(repeat, "has a repeat cut");
  assert.equal(repeat.text, "the");

  const silences = cl.cuts.filter((c) => c.type === "silence");
  assert.ok(silences.some((s) => s.start === 0 && /before the first word/.test(s.reason)), "leading silence");
  assert.ok(silences.some((s) => /pause shortened/.test(s.reason) && s.start >= 2.8 && s.end <= 4.8), "long pause");
  assert.equal(cl.counts.silences, silences.length);

  assert.equal(cl.transcript, "So this is the demo. Thanks.");
});

test("keep + cuts tile the whole timeline and durations add up", async () => {
  const a = await analyze(words, DURATION, false);
  const cl = buildCutList(a);
  const ranges = [...cl.keep.map((k) => ({ ...k, kind: "keep" })), ...cl.cuts.map((c) => ({ start: c.start, end: c.end, kind: "cut" }))].sort(
    (x, y) => x.start - y.start,
  );
  assert.equal(ranges[0].start, 0);
  for (let i = 1; i < ranges.length; i++) assert.ok(Math.abs(ranges[i].start - ranges[i - 1].end) < 0.06, `no gap/overlap at ${ranges[i].start}`);
  assert.ok(Math.abs(ranges[ranges.length - 1].end - DURATION) < 0.06);

  const kept = cl.keep.reduce((s, k) => s + k.end - k.start, 0);
  assert.ok(Math.abs(cl.durationAfter - kept) < 0.01);
  assert.ok(cl.durationAfter < cl.durationBefore);
  assert.ok(Math.abs(cl.savedSec - (cl.durationBefore - cl.durationAfter)) < 0.06);
  assert.ok(cl.savedPct > 0 && cl.savedPct < 100);
});

test("a file with no words is one silence cut", async () => {
  const a = await analyze([], 3, false);
  const cl = buildCutList(a);
  assert.deepEqual(cl.keep, []);
  assert.equal(cl.cuts.length, 1);
  assert.equal(cl.cuts[0].type, "silence");
  assert.equal(cl.durationAfter, 0);
});

test("--json shape: duration, score, keep and cuts with numeric seconds", async () => {
  const a = await analyze(words, DURATION, false);
  const j = buildCutJson(a);
  const cl = buildCutList(a);

  assert.deepEqual(Object.keys(j), ["duration", "score", "keep", "cuts"]);
  assert.equal(j.duration, 6.2);
  assert.equal(j.score, a.score);
  assert.deepEqual(j.keep, cl.keep);
  assert.ok(j.keep.length > 0);
  for (const k of j.keep) {
    assert.deepEqual(Object.keys(k), ["start", "end"]);
    assert.ok(typeof k.start === "number" && typeof k.end === "number" && k.end > k.start);
  }
  assert.equal(j.cuts.length, cl.cuts.length);
  for (const c of j.cuts) {
    assert.deepEqual(Object.keys(c), ["start", "end", "text", "reason"]);
    assert.ok(typeof c.start === "number" && typeof c.end === "number");
  }
  const um = j.cuts.find((c) => c.text === "um");
  assert.ok(um, "the um is in the cut list");
  assert.equal(um.reason, `filler word "um"`);

  // Survives a JSON round trip unchanged, so `--json | jq .keep` sees plain numbers.
  assert.deepEqual(JSON.parse(JSON.stringify(j)), j);
});

test("--json for a file with no words keeps nothing", async () => {
  const j = buildCutJson(await analyze([], 3, false));
  assert.deepEqual(j.keep, []);
  assert.deepEqual(j.cuts.map(({ start, end }) => [start, end]), [[0, 3]]);
});

test("default output sits next to the input", () => {
  assert.equal(defaultOutput("/v/take 1.mov", true), "/v/take 1.umless.mp4");
  assert.equal(defaultOutput("/v/voice.wav", false), "/v/voice.umless.m4a");
  assert.equal(defaultOutput("/v.d/noext", true), "/v.d/noext.umless.mp4");
});

test("a range with several kinds of cut names each one", async () => {
  // "I um I want" -> "um" is a filler and the first "I" a repeat, removed in one range.
  const a = await analyze([w("I", 0.2, 0.3), w("um", 0.32, 0.5), w("I", 0.52, 0.6), w("want", 0.62, 0.9), w("this.", 0.92, 1.2)], 1.5, false);
  const cl = buildCutList(a);
  const c = cl.cuts.find((x) => x.type === "repeat");
  assert.ok(c, "range is typed by its most significant cut");
  assert.equal(c.reason, `stutter / repeated "I"; filler word "um"`);
});
