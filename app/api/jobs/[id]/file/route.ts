import { promises as fs } from "node:fs";
import path from "node:path";
import { getJob, jobDir } from "@/lib/jobs";

export const runtime = "nodejs";

// Serves the original or cleaned file, with Range support so Safari/iOS can play and seek video.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const job = await getJob((await params).id);
  if (!job?.output) return new Response("Not found", { status: 404 });
  const url = new URL(req.url);
  const which = url.searchParams.get("v") === "original" ? job.inputName : job.output;
  const file = path.join(jobDir(job.id), which);
  const size = (await fs.stat(file)).size;
  const type = which.endsWith(".mp4") ? "video/mp4" : which.endsWith(".mov") ? "video/quicktime" : "audio/mp4";
  const headers: Record<string, string> = { "Content-Type": type, "Accept-Ranges": "bytes" };
  if (url.searchParams.has("download")) headers["Content-Disposition"] = `attachment; filename="${which}"`;

  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") || "");
  const start = m && m[1] ? Number(m[1]) : 0;
  const end = m && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  const fh = await fs.open(file, "r");
  const buf = new Uint8Array(end - start + 1);
  await fh.read(buf, 0, buf.length, start);
  await fh.close();
  headers["Content-Length"] = String(buf.length);
  if (m) headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
  return new Response(buf, { status: m ? 206 : 200, headers });
}
