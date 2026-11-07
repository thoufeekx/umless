// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildEdl, framesToTimecode, parseFps, secondsToFrames, sourceTiming, timecodeToFrames } from "./export-edl";
import { parseRate, snapToFrames } from "./pipeline";

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

test("untagged 29.97 is drop-frame, audio-only uses AA, sub-frame segments are skipped", () => {
  const edl = buildEdl(
    [
      { start: 1, end: 1.01 },
      { start: 2, end: 3 },
    ],
    { title: "t", sourceName: "a.wav", fps: 30000 / 1001, hasVideo: false, recordStartFrames: 0 },
  );
  assert.match(edl, /^FCM: DROP FRAME$/m);
  const events = edl.split("\n").filter((l) => /^\d{3} /.test(l));
  assert.deepEqual(events, ["001  AX       AA    C        00:00:02;00 00:00:03;00 00:00:00;00 00:00:01;00"]);
});

test("drop-frame timecode skips the right labels at 29.97 and 59.94", () => {
  const ntsc = 30000 / 1001;
  assert.equal(framesToTimecode(1799, ntsc, true), "00:00:59;29");
  assert.equal(framesToTimecode(1800, ntsc, true), "00:01:00;02");
  assert.equal(framesToTimecode(17982, ntsc, true), "00:10:00;00");
  assert.equal(framesToTimecode(107892, ntsc, true), "01:00:00;00");
  assert.equal(framesToTimecode(3600, 60000 / 1001, true), "00:01:00;04");
  for (const f of [0, 1, 2, 1799, 1800, 1801, 17981, 17982, 107891, 107892, 123456]) {
    assert.equal(timecodeToFrames(framesToTimecode(f, ntsc, true), ntsc).frames, f);
    assert.equal(timecodeToFrames(framesToTimecode(f, 60000 / 1001, true), 60000 / 1001).frames, f);
  }
  // 23.976 and 25 never drop frames, even if a tag uses ";"
  assert.equal(timecodeToFrames("00:01:00;00", 24000 / 1001).dropFrame, false);
  assert.equal(framesToTimecode(1440, 24000 / 1001, true), "00:01:00:00");
});

test("source timecode offsets the source columns and follows the tag's drop-frame mode", () => {
  assert.deepEqual(sourceTiming(25, "10:00:00:00"), { startFrames: 900000, dropFrame: false });
  assert.deepEqual(sourceTiming(30000 / 1001, "01:00:00;00"), { startFrames: 107892, dropFrame: true });
  assert.deepEqual(sourceTiming(30000 / 1001, "01:00:00:00"), { startFrames: 108000, dropFrame: false });
  assert.deepEqual(sourceTiming(30000 / 1001, "garbage"), { startFrames: 0, dropFrame: true });
  const edl = buildEdl([{ start: 2, end: 4 }], { title: "t", sourceName: "c.mov", fps: 25, sourceTimecode: "10:00:00:00" });
  const events = edl.split("\n").filter((l) => /^\d{3} /.test(l));
  assert.deepEqual(events, ["001  AX       AA/V  C        10:00:02:00 10:00:04:00 01:00:00:00 01:00:02:00"]);
  const df = buildEdl([{ start: 60, end: 61 }], { title: "t", sourceName: "c.mov", fps: 30000 / 1001, sourceTimecode: "00:59:59;00" });
  assert.match(df, /^FCM: DROP FRAME$/m);
  // 00:59:59;00 + 1798 frames (60 s * 29.97) = 01:00:59;00 + ... computed on the drop-frame clock
  const ev = df.split("\n").filter((l) => /^\d{3} /.test(l))[0].split(/\s+/);
  assert.equal(timecodeToFrames(ev[4], 30000 / 1001).frames - timecodeToFrames("00:59:59;00", 30000 / 1001).frames, 1798);
  assert.equal(ev[6], "01:00:00;00");
});

test("snapToFrames puts boundaries on the frame grid", () => {
  const r = parseRate("30000/1001");
  assert.deepEqual(r, { num: 30000, den: 1001 });
  assert.deepEqual(parseRate("0/0"), { num: 30, den: 1 });
  const segs = snapToFrames([{ start: 0.01, end: 1.0 }, { start: 2.0, end: 2.01 }], r);
  assert.equal(segs.length, 1);
  assert.equal(segs[0].start, 0);
  assert.equal(segs[0].end, (30 * 1001) / 30000);
  assert.equal(secondsToFrames(segs[0].end, 30000 / 1001), 30);
});
