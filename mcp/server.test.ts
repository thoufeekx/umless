import assert from "node:assert/strict";
import { test } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "./server";

async function connect() {
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "0.0.0" });
  await Promise.all([createServer().connect(a), client.connect(b)]);
  return client;
}

test("lists analyze_video and clean_video with their inputs", async () => {
  const client = await connect();
  const { tools } = await client.listTools();
  const byName = Object.fromEntries(tools.map((t) => [t.name, t]));
  assert.deepEqual(Object.keys(byName).sort(), ["analyze_video", "clean_video"]);
  assert.deepEqual(byName.analyze_video.inputSchema.required, ["path"]);
  assert.deepEqual(byName.clean_video.inputSchema.required, ["path"]);
  assert.ok("options" in (byName.clean_video.inputSchema.properties || {}));
  assert.equal(byName.analyze_video.annotations?.readOnlyHint, true);
  await client.close();
});

test("tool errors come back as isError results, not crashes", async () => {
  const saved = process.env.OPENROUTER_API_KEY;
  const savedBin = process.env.UMLESS_WHISPER_BIN;
  try {
    delete process.env.OPENROUTER_API_KEY;
    process.env.UMLESS_WHISPER_BIN = "/definitely/not/whisper-cli"; // no key and no local whisper

    const client = await connect();
    const r = (await client.callTool({ name: "analyze_video", arguments: { path: "nope.mp4" } })) as { isError?: boolean; content: { text: string }[] };
    assert.equal(r.isError, true);
    assert.match(r.content[0].text, /OPENROUTER_API_KEY/);

    process.env.OPENROUTER_API_KEY = "test";
    const r2 = (await client.callTool({ name: "clean_video", arguments: { path: "/definitely/not/here.mp4" } })) as { isError?: boolean; content: { text: string }[] };
    assert.equal(r2.isError, true);
    assert.match(r2.content[0].text, /No such file|ffmpeg/);
    await client.close();
  } finally {
    if (saved === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = saved;
    if (savedBin === undefined) delete process.env.UMLESS_WHISPER_BIN;
    else process.env.UMLESS_WHISPER_BIN = savedBin;
  }
});
