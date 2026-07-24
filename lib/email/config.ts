import { getSiteUrl } from "@/lib/site";

/** Public app URL for links inside email templates (non-secret). */
export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || getSiteUrl()
  );
}
