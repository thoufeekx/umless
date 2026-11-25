import assert from "node:assert/strict";
import { test } from "node:test";
import { doctorLines, doctorOk, parseFfmpegVersion, runDoctor, type DoctorReport } from "./doctor";

const all: DoctorReport = { ffmpeg: { ok: true, version: "6.1.1" }, key: { ok: true }, tmp: { ok: true }, whisper: { ok: false } };

test("parseFfmpegVersion", () => {
  assert.equal(parseFfmpegVersion("ffmpeg version 6.1.1-3ubuntu5 Copyright (c) 2000-2023"), "6.1.1");
  assert.equal(parseFfmpegVersion("ffmpeg version n7.0.2 Copyright"), "7.0.2");
  assert.equal(parseFfmpegVersion("ffmpeg version N-112345-gabcdef Copyright"), "N-112345");
  assert.equal(parseFfmpegVersion("something else"), undefined);
});

test("runDoctor returns the documented JSON shape and never the key value", async () => {
  const before = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = "sk-or-secret-value";
  try {
    const r = await runDoctor();
    assert.deepEqual(Object.keys(r).sort(), ["ffmpeg", "key", "tmp", "whisper"]);
    assert.equal(typeof r.ffmpeg.ok, "boolean");
    assert.deepEqual(r.key, { ok: true });
    assert.equal(typeof r.tmp.ok, "boolean");
    const json = JSON.stringify(r);
    assert.ok(!json.includes("sk-or-secret-value"));
    assert.ok(!doctorLines(r).join("\n").includes("sk-or-secret-value"));
  } finally {
    if (before === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = before;
  }
});

test("exit status: key or local whisper is enough for transcription", () => {
  assert.equal(doctorOk(all, false), true);
  assert.equal(doctorOk({ ...all, key: { ok: false } }, false), false);
  assert.equal(doctorOk({ ...all, key: { ok: false }, whisper: { ok: true } }, false), true);
  assert.equal(doctorOk(all, true), false); // UMLESS_STT=local without whisper.cpp
  assert.equal(doctorOk({ ...all, ffmpeg: { ok: false } }, false), false);
  assert.equal(doctorOk({ ...all, tmp: { ok: false } }, false), false);
});

test("missing key prints a clear hint", () => {
  const text = doctorLines({ ...all, key: { ok: false } }, false).join("\n");
  assert.match(text, /✗ OPENROUTER_API_KEY is not set/);
  assert.match(text, /set OPENROUTER_API_KEY .*or install whisper\.cpp/);
  assert.match(doctorLines(all, false)[0], /^✓ ffmpeg 6\.1\.1$/);
});
