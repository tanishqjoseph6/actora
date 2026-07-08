import { getGoogleOAuthCallbackUrl, resolveAuthUrl } from "@/lib/auth/nextauth-url";

export type GmailAuthEnvStatus = {
  ok: boolean;
  missing: string[];
  appUrl: string;
  googleCallbackUrl: string;
  checks: Record<string, boolean>;
};

/** Validate auth/Gmail-related env vars (server-only). */
export function checkGmailAuthEnv(): GmailAuthEnvStatus {
  const required = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "NEXTAUTH_SECRET",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ] as const;

  const missing = required.filter((key) => !process.env[key]?.trim());

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    resolveAuthUrl();

  const checks: Record<string, boolean> = {
    GOOGLE_CLIENT_ID: Boolean(process.env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET: Boolean(process.env.GOOGLE_CLIENT_SECRET),
    NEXTAUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET),
    NEXTAUTH_URL: Boolean(process.env.NEXTAUTH_URL),
    AUTH_URL: Boolean(process.env.AUTH_URL),
    NEXT_PUBLIC_APP_URL: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };

  return {
    ok: missing.length === 0,
    missing: [...missing],
    appUrl,
    googleCallbackUrl: getGoogleOAuthCallbackUrl(),
    checks,
  };
}

export function logGmailAuthEnv(scope: string): GmailAuthEnvStatus {
  const status = checkGmailAuthEnv();

  if (!status.ok) {
    console.error(`[${scope}] Missing required env:`, status.missing, {
      appUrl: status.appUrl,
      googleCallbackUrl: status.googleCallbackUrl,
      checks: status.checks,
    });
  } else if (process.env.NODE_ENV === "development") {
    console.log(`[${scope}] Gmail auth env OK`, {
      appUrl: status.appUrl,
      googleCallbackUrl: status.googleCallbackUrl,
    });
  }

  if (
    process.env.NODE_ENV === "production" &&
    status.appUrl !== "https://useactora.com"
  ) {
    console.warn(`[${scope}] NEXT_PUBLIC_APP_URL / auth URL is not canonical:`, {
      expected: "https://useactora.com",
      actual: status.appUrl,
    });
  }

  return status;
}
