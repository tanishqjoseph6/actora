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
    "/cookies",
  ] as const;

  const now = new Date();

  return paths.map((path) => ({
    url: path === "/" ? base : `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/pricing" || path === "/features" ? 0.9 : path === "/privacy" || path === "/terms" || path === "/cookies" ? 0.4 : 0.6,
  }));
}
