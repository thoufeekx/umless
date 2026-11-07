import { defineConfig } from "tsup";

// Builds the npm package (CLI + MCP server) into dist/. The Next.js app is not part of it.
export default defineConfig({
  entry: { umless: "bin/umless.ts" },
  outDir: "dist",
  format: ["esm"],
  platform: "node",
  target: "node20",
  splitting: false,
  clean: true,
});
