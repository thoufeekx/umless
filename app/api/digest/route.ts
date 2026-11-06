// GET /api/digest?key=<ADMIN_KEY>&days=7 → the plain-text daily digest, for Hermes to forward to Telegram.
import { digestText } from "@/lib/track";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = process.env.ADMIN_KEY;
  if (!key || url.searchParams.get("key") !== key) return new Response("Not found", { status: 404 });
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get("days")) || 7));
  return new Response(await digestText(days), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
