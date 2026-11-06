import type { MetadataRoute } from "next";
import { SEO_PAGES } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3210";
  return ["", "/um-score", ...SEO_PAGES.map((p) => `/${p.slug}`)].map((path) => ({ url: base + path, changeFrequency: "weekly" }));
}
