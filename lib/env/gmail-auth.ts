import { getGoogleOAuthCallbackUrl, resolveAuthUrl } from "@/lib/auth/nextauth-url";
import {
  SUPABASE_ENV,
  validateSupabaseProject,
} from "@/lib/supabase/config";

export type GmailAuthEnvStatus = {
  ok: boolean;
  missing: string[];
  appUrl: string;
  googleCallbackUrl: string;
  checks: Record<string, boolean>;
  supabaseProjectRef: string | null;
  supabaseSameProject: boolean;
  supabaseDeprecatedKeys: string[];
};

/** Validate auth/Gmail-related env vars (server-only). */
export function checkGmailAuthEnv(): GmailAuthEnvStatus {
  const required = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "NEXTAUTH_SECRET",
    SUPABASE_ENV.URL,
    SUPABASE_ENV.ANON_KEY,
    SUPABASE_ENV.SERVICE_ROLE_KEY,
  ] as const;

  const missing = required.filter((key) => !process.env[key]?.trim());
  const supabaseProject = validateSupabaseProject();

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
    [SUPABASE_ENV.URL]: Boolean(process.env[SUPABASE_ENV.URL]),
    [SUPABASE_ENV.ANON_KEY]: Boolean(process.env[SUPABASE_ENV.ANON_KEY]),
    [SUPABASE_ENV.SERVICE_ROLE_KEY]: Boolean(
      process.env[SUPABASE_ENV.SERVICE_ROLE_KEY]
    ),
  };

  return {
    ok:
      missing.length === 0 &&
      supabaseProject.ok &&
      supabaseProject.sameProject,
    missing: [...missing],
    appUrl,
    googleCallbackUrl: getGoogleOAuthCallbackUrl(),
    checks,
    supabaseProjectRef: supabaseProject.projectRef,
    supabaseSameProject: supabaseProject.sameProject,
    supabaseDeprecatedKeys: supabaseProject.deprecatedKeysPresent,
  };
}

export function logGmailAuthEnv(scope: string): GmailAuthEnvStatus {
  const status = checkGmailAuthEnv();

  console.log(`[${scope}] Gmail auth env`, {
    ok: status.ok,
    missing: status.missing,
    appUrl: status.appUrl,
    googleCallbackUrl: status.googleCallbackUrl,
    supabaseProjectRef: status.supabaseProjectRef,
    supabaseSameProject: status.supabaseSameProject,
    supabaseDeprecatedKeys: status.supabaseDeprecatedKeys,
    checks: status.checks,
  });

  if (!status.ok) {
    console.error(`[${scope}] Missing or invalid env:`, status.missing);
  }

  if (status.supabaseDeprecatedKeys.length > 0) {
    console.error(
      `[${scope}] Remove duplicate Supabase env vars from Vercel/.env:`,
      status.supabaseDeprecatedKeys
    );
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
