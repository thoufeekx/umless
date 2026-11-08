// Tests for the hosted free-try caps (npm test).
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { checkTry, clientIp, type TryRequest } from "./trygate";

process.chdir(mkdtempSync(path.join(tmpdir(), "umless-try-")));
Object.assign(process.env, { UMLESS_PUBLIC_TRY: "1", UMLESS_TRY_GLOBAL: "4", UMLESS_TRY_PER_IP: "2", UMLESS_TRY_BURST: "100", UMLESS_PROXY_KEY: "k" });

const base: TryRequest = { email: "a@example.com", ip: "1.1.1.1", mode: "cut", size: 10 << 20, running: 0 };
const cheap = async (): Promise<number | null> => 0.5;
const go = (r: Partial<TryRequest>, spend = cheap) => checkTry({ ...base, ...r }, spend);
const status = async (r: Partial<TryRequest>, spend = cheap) => {
  const g = await go(r, spend);
  return g.ok ? 200 : g.status;
};

test("free-try caps", async () => {
  assert.equal(await status({ email: "" }), 400, "email required");
  assert.equal(await status({ mode: "revoice" }), 403, "revoice blocked");
  assert.equal(await status({ size: 201 << 20 }), 413, "200 MB cap");
  assert.equal(await status({ running: 2 }), 503, "concurrency cap");
  assert.equal(await status({}, async () => 3.2), 503, "spend guard");
  assert.equal(await status({}, async () => null), 503, "spend guard fails closed");

  assert.equal(await status({}), 200, "first clip ok");
  assert.equal(await status({ email: "A@Example.com " }), 429, "1 per email per day (case-insensitive)");

  const g = await go({ email: "b@example.com" });
  assert.ok(g.ok);
  await g.release();
  assert.equal(await status({ email: "b@example.com" }), 200, "released slot can be reused");
  assert.equal(await status({ email: "c@example.com" }), 429, "per-IP cap (2)");

  assert.equal(await status({ email: "d@example.com", ip: "2.2.2.2" }), 200);
  assert.equal(await status({ email: "e@example.com", ip: "3.3.3.3" }), 200);
  assert.equal(await status({ email: "f@example.com", ip: "4.4.4.4" }), 503, "global daily cap (4)");

  process.env.UMLESS_TRY_BURST = "3";
  for (let i = 0; i < 3; i++) await go({ ip: "9.9.9.9", email: "" });
  assert.equal(await status({ ip: "9.9.9.9", email: "" }), 429, "burst limit per IP");

  const req = (h: Record<string, string>) => new Request("http://x/", { headers: h });
  assert.equal(clientIp(req({ "x-umless-proxy-key": "k", "x-umless-client-ip": "5.5.5.5" })), "5.5.5.5", "trusted proxy header");
  assert.equal(clientIp(req({ "x-umless-proxy-key": "bad", "x-umless-client-ip": "5.5.5.5", "x-forwarded-for": "6.6.6.6, 7.7.7.7" })), "7.7.7.7", "spoofed header ignored");
});
