// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { analyze, tightenToSpeech } from "./pipeline";
import { dtwPreset, parseWhisperJson, useLocalStt, whisperModel } from "./whisper";

const seg = (text: string, from: number, to: number) => ({ text, offsets: { from, to } });

// Shape of whisper.cpp `-oj -ml 1 -sow` output: one segment per word, leading spaces, offsets in ms.
const sample = {
  transcription: [
    seg("", 0, 0),
    seg(" So,", 800, 1160),
    seg(" um,", 1200, 1500),
    seg(" I", 1500, 1620),
    seg(" think...", 1620, 2100),
    seg(" [BLANK_AUDIO]", 2100, 4000),
    seg(" ...", 4000, 4100),
    seg(" uh", 4100, 4300),
    seg(" yeah.", 4300, 4700),
  ],
};

test("parseWhisperJson turns whisper.cpp -ml 1 word segments into Word[] in seconds", () => {
  assert.deepEqual(parseWhisperJson(sample), [
    { text: "So,", start: 0.8, end: 1.16 },
    { text: "um,", start: 1.2, end: 1.5 },
    { text: "I", start: 1.5, end: 1.62 },
    { text: "think...", start: 1.62, end: 2.1 },
    { text: "uh", start: 4.1, end: 4.3 },
    { text: "yeah.", start: 4.3, end: 4.7 },
  ]);
});

// Shape of `-ojf -dtw base.en` output: tokens with DTW onsets in centiseconds; special tokens have t_dtw -1.
const tok = (text: string, t_dtw: number) => ({ text, t_dtw });
const dtwSample = {
  transcription: [
    { text: " Um, so hi.", offsets: { from: 0, to: 2000 }, tokens: [tok("[_BEG_]", -1), tok(" Um", 32), tok(",", 76), tok(" so", 106), tok(" hi", 182), tok(".", 200), tok("[_TT_100]", -1)] },
    { text: " I'm", offsets: { from: 2000, to: 4000 }, tokens: [tok(" I", 300), tok("'m", 306)] },
  ],
};

test("parseWhisperJson builds words from DTW tokens; each word runs until the next one starts", () => {
  const out = parseWhisperJson(dtwSample).map((w) => ({ ...w, start: +w.start.toFixed(2), end: +w.end.toFixed(2) }));
  assert.deepEqual(out, [
    { text: "Um,", start: 0.24, end: 0.98 },
    { text: "so", start: 0.98, end: 1.74 },
    { text: "hi.", start: 1.74, end: 2.92 },
    { text: "I'm", start: 2.92, end: 4 },
  ]);
});

test("tightenToSpeech shrinks a word to the loud audio in its span, exposing the pause", () => {
  // 10 ms frames: speech 0.3-0.5 s and 1.0-1.3 s, digital silence elsewhere.
  const rms = Array.from({ length: 150 }, (_, f) => ((f >= 30 && f < 50) || (f >= 100 && f < 130) ? 3000 : 0));
  const [um, so] = tightenToSpeech([{ text: "Um", start: 0.25, end: 0.98 }, { text: "so", start: 0.98, end: 1.5 }], rms);
  assert.ok(Math.abs(um.start - 0.27) < 0.011 && Math.abs(um.end - 0.53) < 0.011, `um ${um.start}-${um.end}`);
  assert.ok(Math.abs(so.start - 0.98) < 0.011 && Math.abs(so.end - 1.33) < 0.011, `so ${so.start}-${so.end}`);
});

test("dtwPreset maps model files to whisper.cpp DTW presets", () => {
  assert.equal(dtwPreset("/x/ggml-base.en.bin"), "base.en");
  assert.equal(dtwPreset("ggml-large-v3-turbo-q5_0.bin"), "large.v3.turbo");
  assert.equal(dtwPreset("my-finetune.bin"), null);
});

test("parseWhisperJson tolerates empty output", () => {
  assert.deepEqual(parseWhisperJson({}), []);
  assert.deepEqual(parseWhisperJson({ transcription: [] }), []);
});

test("whisper words feed analyze() unchanged: fillers are found without any API key", async () => {
  const a = await analyze(parseWhisperJson(sample), 5, false);
  assert.equal(a.fillerCount, 2);
});

test("local STT is used when forced or when there is no OpenRouter key", () => {
  const saved = { key: process.env.OPENROUTER_API_KEY, stt: process.env.UMLESS_STT, model: process.env.UMLESS_WHISPER_MODEL };
  try {
    delete process.env.UMLESS_STT;
    delete process.env.OPENROUTER_API_KEY;
    assert.equal(useLocalStt(), true);
    process.env.OPENROUTER_API_KEY = "test";
    assert.equal(useLocalStt(), false);
    process.env.UMLESS_STT = "local";
    assert.equal(useLocalStt(), true);
    process.env.UMLESS_WHISPER_MODEL = "~/m.bin";
    assert.ok(!whisperModel().startsWith("~") && whisperModel().endsWith("/m.bin"));
  } finally {
    for (const [k, v] of [["OPENROUTER_API_KEY", saved.key], ["UMLESS_STT", saved.stt], ["UMLESS_WHISPER_MODEL", saved.model]] as const) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});
