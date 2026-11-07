// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildEdl, framesToTimecode, parseFps, secondsToFrames } from "./export-edl";

test("parseFps reads ffprobe rates and falls back to 30", () => {
  assert.equal(parseFps("30/1"), 30);
  assert.equal(parseFps("25"), 25);
  assert.ok(Math.abs(parseFps("30000/1001") - 29.97) < 0.001);
  assert.ok(Math.abs(parseFps("24000/1001") - 23.976) < 0.001);
  assert.equal(parseFps("0/0"), 30);
  assert.equal(parseFps(undefined), 30);
  assert.equal(parseFps("90000/1"), 30);
});

test("timecode conversion", () => {
  assert.equal(framesToTimecode(0, 30), "00:00:00:00");
  assert.equal(framesToTimecode(29, 30), "00:00:00:29");
  assert.equal(framesToTimecode(30, 30), "00:00:01:00");
  assert.equal(framesToTimecode(3600 * 30, 30), "01:00:00:00");
  assert.equal(framesToTimecode(25 * 61 + 3, 25), "00:01:01:03");
  assert.equal(secondsToFrames(1.5, 30), 45);
  // 29.97 and 23.976 count frames on a 30 / 24 base (non-drop-frame).
  assert.equal(secondsToFrames(10, 30000 / 1001), 300);
  assert.equal(framesToTimecode(300, 30000 / 1001), "00:00:10:00");
  assert.equal(framesToTimecode(secondsToFrames(60, 24000 / 1001), 24000 / 1001), "00:00:59:23");
});

test("3 kept segments become 3 back-to-back events", () => {
  const edl = buildEdl(
    [
      { start: 0.5, end: 2.0 },
      { start: 3.0, end: 4.0 },
      { start: 10.0, end: 12.5 },
    ],
    { title: "demo.umless", sourceName: "demo.mp4", fps: 30 },
  );
  const events = edl.split("\n").filter((l) => /^\d{3} /.test(l));
  assert.deepEqual(events, [
    "001  AX       AA/V  C        00:00:00:15 00:00:02:00 01:00:00:00 01:00:01:15",
    "002  AX       AA/V  C        00:00:03:00 00:00:04:00 01:00:01:15 01:00:02:15",
    "003  AX       AA/V  C        00:00:10:00 00:00:12:15 01:00:02:15 01:00:05:00",
  ]);
  assert.match(edl, /^TITLE: demo\.umless\nFCM: NON-DROP FRAME\n/);
  assert.equal(edl.match(/\* FROM CLIP NAME: demo\.mp4/g)?.length, 3);
});

test("29.97 gets a non-drop-frame note, audio-only uses AA, sub-frame segments are skipped", () => {
  const edl = buildEdl(
    [
      { start: 1, end: 1.01 },
      { start: 2, end: 3 },
    ],
    { title: "t", sourceName: "a.wav", fps: 30000 / 1001, hasVideo: false, recordStartFrames: 0 },
  );
  assert.match(edl, /29\.97 fps written as 30 fps NON-DROP FRAME/);
  const events = edl.split("\n").filter((l) => /^\d{3} /.test(l));
  assert.deepEqual(events, ["001  AX       AA    C        00:00:02:00 00:00:03:00 00:00:00:00 00:00:01:00"]);
});
