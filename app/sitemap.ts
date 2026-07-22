import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const paths = [
    "/",
    "/features",
    "/pricing",
    "/faq",
    "/contact",
    "/privacy",
    "/terms",
  ] as const;

  const now = new Date();

  return paths.map((path) => ({
    url: path === "/" ? base : `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/pricing" || path === "/features" ? 0.9 : 0.6,
  }));
}
