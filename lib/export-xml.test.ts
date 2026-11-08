// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildFcpxml, buildXmeml, fcpTime, fileUrl, type MediaInfo } from "./export-xml";

const segs = [
  { start: 0.5, end: 2.0 },
  { start: 3.0, end: 4.0 },
  { start: 10.0, end: 12.5 },
];
const media = (over: Partial<MediaInfo> = {}): MediaInfo => ({
  path: "/home/me/My Clips/take 1.mp4",
  name: "take 1.mp4",
  rate: { num: 30, den: 1 },
  hasVideo: true,
  width: 1920,
  height: 1080,
  sampleRate: 48000,
  channels: 2,
  durationSec: 87.2,
  ...over,
});
const all = (s: string, re: RegExp) => [...s.matchAll(re)].map((m) => m[1]);

test("fileUrl percent-encodes and handles Windows drives", () => {
  assert.equal(fileUrl("/home/me/My Clips/take 1.mp4", true), "file://localhost/home/me/My%20Clips/take%201.mp4");
  assert.equal(fileUrl("/a/b&c.mov"), "file:///a/b%26c.mov");
  assert.equal(fileUrl("C:\\Users\\me\\a b.mp4"), "file:///C:/Users/me/a%20b.mp4");
});

test("fcpTime writes exact rationals", () => {
  assert.equal(fcpTime(0, { num: 30, den: 1 }), "0s");
  assert.equal(fcpTime(45, { num: 30, den: 1 }), "3/2s");
  assert.equal(fcpTime(30, { num: 30, den: 1 }), "1s");
  assert.equal(fcpTime(1, { num: 30000, den: 1001 }), "1001/30000s");
  assert.equal(fcpTime(30, { num: 30000, den: 1001 }), "1001/1000s");
  assert.equal(fcpTime(1, { num: 25, den: 1 }), "1/25s");
});

test("xmeml: one clip per kept segment on V1 and A1, butted, linked, referencing the original", () => {
  const x = buildXmeml(segs, media(), { title: "take 1.umless" });
  assert.match(x, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<!DOCTYPE xmeml>\n<xmeml version="4">/);
  assert.equal((x.match(/<clipitem /g) || []).length, 6);
  assert.deepEqual(all(x, /<in>(-?\d+)<\/in>/g), ["-1", "15", "90", "300", "15", "90", "300"]);
  assert.deepEqual(all(x, /<out>(-?\d+)<\/out>/g), ["-1", "60", "120", "375", "60", "120", "375"]);
  assert.deepEqual(all(x, /<start>(\d+)<\/start>/g), ["0", "45", "75", "0", "45", "75"]);
  assert.deepEqual(all(x, /<end>(\d+)<\/end>/g), ["45", "75", "150", "45", "75", "150"]);
  assert.match(x, /<sequence id="sequence-1">\n {4}<name>take 1\.umless<\/name>\n {4}<duration>150<\/duration>/);
  assert.equal((x.match(/<file id="file-1">/g) || []).length, 1); // full definition once, then references
  assert.equal((x.match(/<file id="file-1"\/>/g) || []).length, 5);
  assert.match(x, /<pathurl>file:\/\/localhost\/home\/me\/My%20Clips\/take%201\.mp4<\/pathurl>/);
  assert.match(x, /<duration>2616<\/duration>/); // source length in frames
  assert.match(x, /<timebase>30<\/timebase>\n\s+<ntsc>FALSE<\/ntsc>/);
  assert.match(x, /<string>01:00:00:00<\/string>\n\s+<frame>108000<\/frame>\n\s+<displayformat>NDF<\/displayformat>/);
  assert.equal((x.match(/<linkclipref>/g) || []).length, 12);
});

test("xmeml: 29.97 drop-frame with source timecode, and escaping", () => {
  const x = buildXmeml([{ start: 1, end: 2 }], media({ rate: { num: 30000, den: 1001 }, sourceTimecode: "00:59:59;00", name: "a&b.mov" }), { title: "<t>" });
  assert.match(x, /<timebase>30<\/timebase>\n\s+<ntsc>TRUE<\/ntsc>/);
  assert.match(x, /<string>00:59:59;00<\/string>\n\s+<frame>107862<\/frame>\n\s+<displayformat>DF<\/displayformat>/);
  assert.match(x, /<string>01:00:00;00<\/string>\n\s+<frame>107892<\/frame>/);
  assert.match(x, /<name>a&amp;b\.mov<\/name>/);
  assert.match(x, /<name>&lt;t&gt;<\/name>/);
  assert.deepEqual(all(x, /<in>(-?\d+)<\/in>/g).slice(1), ["30", "30"]); // in/out are frames from the file's first frame
});

test("xmeml: audio-only has no video track", () => {
  const x = buildXmeml(segs, media({ hasVideo: false }), { title: "t" });
  assert.doesNotMatch(x, /<video>/);
  assert.equal((x.match(/<clipitem /g) || []).length, 3);
  assert.doesNotMatch(x, /<link>/);
});

test("fcpxml 1.10: asset-clips on the spine with exact rational times", () => {
  const x = buildFcpxml(segs, media(), { title: "take 1.umless" });
  assert.match(x, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<!DOCTYPE fcpxml>\n<fcpxml version="1.10">/);
  assert.match(x, /<format id="r1" frameDuration="1\/30s" width="1920" height="1080"/);
  assert.match(x, /<media-rep kind="original-media" src="file:\/\/\/home\/me\/My%20Clips\/take%201\.mp4"\/>/);
  assert.deepEqual(all(x, /<asset-clip [^>]*offset="([^"]+)"/g), ["3600s", "7203/2s", "7205/2s"]);
  assert.deepEqual(all(x, /<asset-clip [^>]*start="([^"]+)"/g), ["1/2s", "3s", "10s"]);
  assert.deepEqual(all(x, /<asset-clip [^>]*duration="([^"]+)"/g), ["3/2s", "1s", "5/2s"]);
  assert.match(x, /<sequence format="r1" duration="5s" tcStart="3600s" tcFormat="NDF" audioLayout="stereo" audioRate="48k">/);
});

test("fcpxml: 29.97 DF source timecode shifts asset start and clip starts", () => {
  const r = { num: 30000, den: 1001 };
  const x = buildFcpxml([{ start: (30 * 1001) / 30000, end: (60 * 1001) / 30000 }], media({ rate: r, sourceTimecode: "01:00:00;00" }), { title: "t" });
  assert.match(x, /frameDuration="1001\/30000s"/);
  // 01:00:00;00 DF = 107892 frames; asset start and clip start 30 frames later
  assert.match(x, new RegExp(`<asset id="r2" name="take 1" start="${fcpTime(107892, r)}"`));
  assert.match(x, new RegExp(`<asset-clip [^>]*start="${fcpTime(107922, r)}" duration="${fcpTime(30, r)}"`));
  assert.match(x, new RegExp(`tcStart="${fcpTime(107892, r)}" tcFormat="DF"`));
});
