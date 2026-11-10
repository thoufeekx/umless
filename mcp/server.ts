// Umless MCP server (stdio). Lets Claude Code, Claude Desktop, Cursor and other MCP clients
// analyze and clean talking-head videos. Run with `umless mcp` (or `npx tsx mcp/server.ts` from a clone).
// stdout carries the MCP protocol, so nothing in here may console.log.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { analyzeFile, cleanFile } from "../lib/cutlist";

export const VERSION = "0.1.0";

type Extra = {
  _meta?: { progressToken?: string | number };
  sendNotification: (n: { method: "notifications/progress"; params: { progressToken: string | number; progress: number; total?: number; message?: string } }) => Promise<void>;
};

// Reports each pipeline step as MCP progress, so clients can show it and keep long renders alive.
function progress(extra: Extra, total: number) {
  let n = 0;
  const token = extra._meta?.progressToken;
  return (message: string) => {
    n++;
    if (token !== undefined) extra.sendNotification({ method: "notifications/progress", params: { progressToken: token, progress: n, total, message } }).catch(() => {});
  };
}

const ok = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });
const fail = (e: unknown) => ({ content: [{ type: "text" as const, text: `Umless error: ${e instanceof Error ? e.message : String(e)}` }], isError: true });

export function createServer() {
  const server = new McpServer({ name: "umless", version: VERSION });

  server.registerTool(
    "analyze_video",
    {
      title: "Analyze a video for ums, stutters, retakes and dead air",
      description:
        "Transcribes a local video or audio file and returns the cut list Umless would apply, without rendering anything: every filler word (um, uh), stutter/repeated phrase, retake/false start and long silence, each with start/end timestamps in seconds and a reason, plus the kept segments, an Um Score (0-100) and the before/after duration. Use it to preview or explain edits before calling clean_video. Needs ffmpeg plus either OPENROUTER_API_KEY (cloud transcription, about $0.02 per 3 minutes of audio) or a local whisper.cpp install (free; no retake detection).",
      inputSchema: {
        path: z.string().describe("Path to a local video or audio file (absolute, or relative to the server's working directory)"),
        retakes: z.boolean().optional().describe("Also ask an LLM to find retakes and false starts (default true)"),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ path, retakes }, extra) => {
      try {
        const { cutList } = await analyzeFile(path, { retakes, onStep: progress(extra as Extra, 3) });
        return ok(cutList);
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "clean_video",
    {
      title: "Cut ums, stutters, retakes and dead air out of a video",
      description:
        "Renders a cleaned copy of a local talking-head video or audio file with filler words, stutters, retakes and long pauses removed (cuts snap to silence, with short fades so there are no clicks). The original is never modified. Returns the output path, before/after duration, seconds saved, Um Score, counts of what was cut, and the full cut list. Video comes out as .mp4, audio as .m4a. Needs ffmpeg plus either OPENROUTER_API_KEY or a local whisper.cpp install.",
      inputSchema: {
        path: z.string().describe("Path to a local video or audio file"),
        out: z.string().optional().describe("Output path (default: <input>.umless.mp4 next to the input, or .m4a for audio)"),
        options: z
          .object({
            retakes: z.boolean().optional().describe("Use an LLM to also cut retakes and false starts (default true)"),
            studio_sound: z.boolean().optional().describe("Also denoise, compress and loudness-normalise the voice to -16 LUFS with ffmpeg (default false)"),
          })
          .optional(),
      },
      annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ path, out, options }, extra) => {
      try {
        const result = await cleanFile(path, {
          out,
          retakes: options?.retakes,
          studioSound: options?.studio_sound,
          onStep: progress(extra as Extra, options?.studio_sound ? 5 : 4),
        });
        return ok(result);
      } catch (e) {
        return fail(e);
      }
    },
  );

  return server;
}

export async function startStdio() {
  const server = createServer();
  await server.connect(new StdioServerTransport());
  console.error(`umless MCP server ${VERSION} ready on stdio`);
}

// Run directly: `npx tsx mcp/server.ts`
if (process.argv[1] && /mcp[\\/]server\.(ts|js|mjs)$/.test(process.argv[1])) {
  startStdio().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
