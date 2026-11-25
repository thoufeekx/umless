#!/usr/bin/env node
// Entry point for `npx umless`. `umless mcp` starts the MCP server on stdio; anything else runs the CLI.
import { checkFfmpeg } from "../lib/cutlist";

async function main() {
  if (process.argv[2] === "mcp") {
    const { startStdio } = await import("../mcp/server");
    await startStdio();
    return;
  }
  // `umless doctor` reports a missing ffmpeg itself instead of failing up front.
  if (process.argv[2] && !process.argv[2].startsWith("-") && process.argv[2] !== "doctor") await checkFfmpeg();
  await import("../cli/umless");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
