// End-to-end check of the MCP server over real stdio: starts `umless mcp`, calls analyze_video and
// clean_video on a clip, and prints the results. Needs ffmpeg and OPENROUTER_API_KEY.
//   node scripts/mcp-e2e.mjs <clip> [server command...]     (default server: npx tsx mcp/server.ts)
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const [clip, ...cmd] = process.argv.slice(2);
if (!clip) {
  console.error("usage: node scripts/mcp-e2e.mjs <clip> [server command...]");
  process.exit(1);
}
const [command, ...args] = cmd.length ? cmd : ["npx", "tsx", "mcp/server.ts"];
const transport = new StdioClientTransport({ command, args, env: { ...process.env }, stderr: "inherit" });
const client = new Client({ name: "umless-e2e", version: "0.0.0" });
await client.connect(transport);

const { tools } = await client.listTools();
console.log("tools:", tools.map((t) => t.name).join(", "));

const call = async (name, args) => {
  const t = Date.now();
  const r = await client.callTool({ name, arguments: args }, undefined, {
    timeout: 600_000,
    onprogress: (p) => console.log(`  [${name}] ${p.progress}/${p.total ?? "?"} ${p.message ?? ""}`),
  });
  if (r.isError) throw new Error(`${name}: ${r.content[0].text}`);
  console.log(`${name} ok in ${((Date.now() - t) / 1000).toFixed(1)}s`);
  return JSON.parse(r.content[0].text);
};

const cl = await call("analyze_video", { path: clip });
console.log(JSON.stringify({ ...cl, keep: `${cl.keep.length} segments`, cuts: cl.cuts.slice(0, 8), transcript: cl.transcript.slice(0, 200) }, null, 2));
console.log(`  ${cl.cuts.length} cuts total`);

const res = await call("clean_video", { path: clip, ...(process.env.UMLESS_E2E_STUDIO ? { options: { studio_sound: true } } : {}) });
console.log(JSON.stringify({ ...res, cutList: undefined }, null, 2));
await client.close();
