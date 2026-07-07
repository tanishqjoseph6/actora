const LOCAL_AUTH_URL = "http://localhost:3000";
const PRODUCTION_URL = "https://useactora.com";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function isDevelopment(): boolean {
  return process.env.NODE_ENV !== "production";
}

/** Resolve the canonical app origin for metadata and non-request contexts. */
export function resolveAuthUrl(): string {
  if (isDevelopment()) {
    const explicit = process.env.NEXTAUTH_URL?.trim();

    if (explicit) {
      const url = stripTrailingSlash(explicit);
      if (url.includes("useactora.com")) {
        console.warn(
          "[auth] Ignoring production NEXTAUTH_URL in development; using http://localhost:3000"
        );
        return LOCAL_AUTH_URL;
      }
      return url;
    }

    return LOCAL_AUTH_URL;
  }

  const explicit = process.env.NEXTAUTH_URL?.trim();
  const netlifyUrl = process.env.URL?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim();

  const platformUrl = netlifyUrl
    ? stripTrailingSlash(netlifyUrl)
    : vercelUrl
      ? stripTrailingSlash(`https://${vercelUrl}`)
      : undefined;

  if (explicit && !explicit.includes("localhost")) {
    return stripTrailingSlash(explicit);
  }
  if (platformUrl) return platformUrl;
  return PRODUCTION_URL;
}

/** Google OAuth redirect URI registered in Google Cloud Console. */
export function getGoogleOAuthCallbackUrl(): string {
  return `${resolveAuthUrl()}/api/auth/callback/google`;
}

/**
 * Configure NextAuth environment before handlers run.
 * On Vercel/Netlify, trust the request host so OAuth callbacks match the live domain.
 */
export function configureNextAuthEnv(): string {
  const url = resolveAuthUrl();

  if (process.env.VERCEL || process.env.URL) {
    process.env.AUTH_TRUST_HOST = "true";
  }

  process.env.NEXTAUTH_URL = url;

  return url;
}

export function shouldUseSecureCookies(): boolean {
  if (process.env.VERCEL || process.env.URL) {
    return true;
  }
  return resolveAuthUrl().startsWith("https://");
}
