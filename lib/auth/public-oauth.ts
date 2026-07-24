/** Canonical production origin (client-safe). */
export const PRODUCTION_APP_URL = "https://useactora.com";

/** Google OAuth redirect URI registered in Google Cloud Console (client-safe). */
export function getPublicGoogleOAuthCallbackUrl(appOrigin?: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  const base = (appOrigin ?? fromEnv ?? PRODUCTION_APP_URL).replace(/\/$/, "");

  if (
    base === PRODUCTION_APP_URL ||
    base.endsWith("useactora.com") ||
    base.endsWith("www.useactora.com")
  ) {
    return `${PRODUCTION_APP_URL}/api/auth/callback/google`;
  }

  return `${base}/api/auth/callback/google`;
}
