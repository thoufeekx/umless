import { createJob, Mode, runningJobs } from "@/lib/jobs";
import { checkTry, clientIp, publicTry, recordTryEmail, tryLimits } from "@/lib/trygate";

export const runtime = "nodejs";
const MODES: Mode[] = ["score", "cut", "studio", "revoice"];

// Uploads may come straight to the tunnel (big files skip the Worker's 100 MB request cap), so the app's own
// public origin is allowed cross-origin on this one endpoint.
function cors(req: Request): Record<string, string> {
  const allowed = process.env.UMLESS_APP_ORIGIN;
  const origin = req.headers.get("origin");
  if (!allowed || origin !== allowed) return {};
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "x-umless-email, x-umless-mode",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: cors(req) });
}

export async function POST(req: Request) {
  const headers = cors(req);
  const fail = (error: string, status: number) => Response.json({ error }, { status, headers });

  let release: (() => Promise<void>) | null = null;
  if (publicTry()) {
    // Checked before the body is read, so an over-limit or rate-limited upload costs us nothing.
    const size = Number(req.headers.get("content-length") || 0);
    if (!size) return fail("Attach a video or audio file.", 411);
    const gate = await checkTry({
      email: req.headers.get("x-umless-email") || "",
      ip: clientIp(req),
      mode: req.headers.get("x-umless-mode") || "",
      size,
      running: runningJobs(),
    });
    if (!gate.ok) return fail(gate.error, gate.status);
    release = gate.release;
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    const mode = String(form.get("mode") || "score") as Mode;
    const voice = String(form.get("voice") || "me");
    const max = publicTry() ? tryLimits().maxBytes : 500 * 1024 * 1024;
    const bad =
      !(file instanceof File) || file.size === 0
        ? fail("Attach a video or audio file.", 400)
        : file.size > max
          ? fail(`Max ${Math.round(max / 1048576)} MB for now.`, 413)
          : !MODES.includes(mode) || (publicTry() && mode !== req.headers.get("x-umless-mode"))
            ? fail("Unknown mode.", 400)
            : null;
    if (bad || !(file instanceof File)) {
      await release?.();
      return bad!;
    }
    const job = await createJob(file, mode, voice);
    if (publicTry()) recordTryEmail(req.headers.get("x-umless-email") || "");
    return Response.json({ id: job.id }, { headers });
  } catch {
    await release?.();
    return fail("Upload failed. Try again.", 400);
  }
}
