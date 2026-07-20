import { resolveAuthUrl } from "@/lib/auth/nextauth-url";

export const SITE_NAME = "Actora";

export const SITE_DESCRIPTION =
  "Where conversations become execution. Actora transforms emails into tasks, CRM updates, meetings, and AI-powered workflows.";

export function getSiteUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (publicUrl) {
    const normalized = publicUrl.replace(/\/$/, "");
    if (
      process.env.NODE_ENV === "production" &&
      normalized !== "https://useactora.com"
    ) {
      console.warn(
        "[site] NEXT_PUBLIC_APP_URL should be https://useactora.com in production; got:",
        normalized
      );
    }
    return normalized;
  }

  if (process.env.NODE_ENV === "production") {
    return "https://useactora.com";
  }

  return resolveAuthUrl();
}
