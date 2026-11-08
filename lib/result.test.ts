// Tests for the free-try result screen math and error copy (npm test).
import assert from "node:assert/strict";
import { test } from "node:test";
import { explainUpload, fmtSec, shareText, summarize } from "./result";
import { umScore } from "./score";

const job = {
  duration: 32,
  stats: { score: 48, fillerCount: 6, repeatCount: 2, retakeCount: 1, deadAirSec: 4.2, savedSec: 9.6, outDuration: 22.4 },
  transcript: [{ text: "Um,", cut: "filler" }, { text: "hi" }, { text: "uh" }, { text: "there" }],
};

test("summarize: before/after from the job", () => {
  const m = summarize(job)!;
  assert.equal(m.beforeSec, 32);
  assert.equal(m.afterSec, 22.4);
  assert.equal(m.savedSec, 9.6);
  assert.equal(m.savedPct, 30);
  assert.deepEqual([m.ums, m.repeats, m.retakes, m.silenceSec], [6, 2, 1, 4.2]);
  assert.equal(m.scoreBefore, 48);
  // one kept "uh" in 22.4s => 2.68/min * 2.5 => 93
  assert.equal(m.scoreAfter, umScore({ fillerCount: 1, stumbleCount: 0, deadAirSec: 0, duration: 22.4 }));
  assert.equal(m.scoreAfter, 93);
});

test("summarize: no stats -> null, after never below before", () => {
  assert.equal(summarize({ duration: 10 }), null);
  const m = summarize({ duration: 10, stats: { ...job.stats, score: 99, outDuration: 1 }, transcript: [{ text: "um" }] })!;
  assert.equal(m.scoreAfter, 99);
});

test("share line has the score and the ref=share link", () => {
  const t = shareText(summarize(job)!);
  assert.match(t, /from 48 to 93\/100/);
  assert.match(t, /6 ums and 4s of dead air/);
  assert.match(t, /umless\.thoufeekxlabs\.com\/\?ref=share$/);
  assert.equal(fmtSec(75), "1m 15s");
});

test("cap rejections are explained with a next step", () => {
  assert.equal(explainUpload(429, "You've used today's free clip. Come back tomorrow.").next, "order");
  assert.equal(explainUpload(429, "Too many requests. Wait a minute and try again.").next, "retry");
  assert.equal(explainUpload(503, "Busy cleaning other videos right now. Try again in a couple of minutes.").next, "retry");
  assert.equal(explainUpload(503, "The free tier is full for today.").next, "order");
  assert.equal(explainUpload(403).next, "fix");
  assert.equal(explainUpload(413).next, "fix");
  assert.equal(explainUpload(0).next, "retry");
});

test("umScore matches the old inline formula", () => {
  // 3 fillers + 2 stumbles + 3s dead air in 60s: 100 - (7.5 + 2 + 2.5) = 88
  assert.equal(umScore({ fillerCount: 3, stumbleCount: 2, deadAirSec: 3, duration: 60 }), 88);
});
