import { createJob, Mode } from "@/lib/jobs";

export const runtime = "nodejs";
const MODES: Mode[] = ["score", "cut", "studio", "revoice"];

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  const mode = String(form.get("mode") || "score") as Mode;
  const voice = String(form.get("voice") || "me");
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: "Attach a video or audio file." }, { status: 400 });
  if (file.size > 500 * 1024 * 1024) return Response.json({ error: "Max 500 MB for now." }, { status: 413 });
  if (!MODES.includes(mode)) return Response.json({ error: "Unknown mode." }, { status: 400 });
  const job = await createJob(file, mode, voice);
  return Response.json({ id: job.id });
}
