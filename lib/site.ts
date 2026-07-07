import { resolveAuthUrl } from "@/lib/auth/nextauth-url";

export const SITE_NAME = "Actora";

export const SITE_DESCRIPTION =
  "Your AI employee for email and operations — inbox automation, CRM, and team workflows.";

export function getSiteUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (publicUrl) return publicUrl.replace(/\/$/, "");
  return resolveAuthUrl();
}
