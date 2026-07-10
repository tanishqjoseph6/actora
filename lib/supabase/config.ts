/**
 * Single source of truth for Supabase environment configuration.
 *
 * Canonical env vars (only these should be set in .env.local and Vercel):
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - SUPABASE_SERVICE_ROLE_KEY
 */

export const SUPABASE_ENV = {
  URL: "NEXT_PUBLIC_SUPABASE_URL",
  ANON_KEY: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  SERVICE_ROLE_KEY: "SUPABASE_SERVICE_ROLE_KEY",
} as const;

/** Legacy / duplicate names that must not be set alongside the canonical vars. */
export const DEPRECATED_SUPABASE_ENV_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_KEY",
  "NEXT_PUBLIC_SUPABASE_KEY",
  "SUPABASE_SERVICE_ROLE",
  "SUPABASE_JWT_SECRET",
  "SUPABASE_DB_URL",
] as const;

export function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function getSupabaseUrl(): string | undefined {
  return trimEnv(process.env[SUPABASE_ENV.URL]);
}

export function getSupabaseAnonKey(): string | undefined {
  return trimEnv(process.env[SUPABASE_ENV.ANON_KEY]);
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return trimEnv(process.env[SUPABASE_ENV.SERVICE_ROLE_KEY]);
}

export function extractProjectRefFromUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    const match = host.match(/^([a-z0-9]+)\.supabase\.co$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function extractProjectRefFromJwt(key: string): string | null {
  try {
    const parts = key.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8")
    ) as { ref?: string };
    return payload.ref ?? null;
  } catch {
    return null;
  }
}

export function extractJwtRole(key: string): string | null {
  try {
    const parts = key.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8")
    ) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export type SupabaseProjectValidation = {
  ok: boolean;
  projectRef: string | null;
  url: string | null;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  sameProject: boolean;
  serviceRole: string | null;
  deprecatedKeysPresent: string[];
  missing: string[];
  warnings: string[];
};

export function validateSupabaseProject(): SupabaseProjectValidation {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  const deprecatedKeysPresent = DEPRECATED_SUPABASE_ENV_KEYS.filter((key) =>
    Boolean(trimEnv(process.env[key]))
  );

  const missing: string[] = [];
  if (!url) missing.push(SUPABASE_ENV.URL);
  if (!anonKey) missing.push(SUPABASE_ENV.ANON_KEY);
  if (!serviceRoleKey) missing.push(SUPABASE_ENV.SERVICE_ROLE_KEY);

  const warnings: string[] = [];

  if (deprecatedKeysPresent.length > 0) {
    warnings.push(
      `Remove duplicate Supabase env vars: ${deprecatedKeysPresent.join(", ")}. ` +
        `Use only ${Object.values(SUPABASE_ENV).join(", ")}.`
    );
  }

  const urlRef = url ? extractProjectRefFromUrl(url) : null;
  const keyRef = serviceRoleKey
    ? extractProjectRefFromJwt(serviceRoleKey)
    : null;
  const serviceRole = serviceRoleKey ? extractJwtRole(serviceRoleKey) : null;

  if (url && !urlRef) {
    warnings.push(
      `${SUPABASE_ENV.URL} must be https://<project-ref>.supabase.co`
    );
  }

  if (serviceRoleKey && serviceRole && serviceRole !== "service_role") {
    warnings.push(
      `${SUPABASE_ENV.SERVICE_ROLE_KEY} must be the service_role JWT (got role: ${serviceRole}).`
    );
  }

  const sameProject = Boolean(urlRef && keyRef && urlRef === keyRef);

  if (urlRef && keyRef && urlRef !== keyRef) {
    warnings.push(
      `Supabase project mismatch: URL ref (${urlRef}) !== service role ref (${keyRef}).`
    );
  }

  const ok =
    missing.length === 0 &&
    sameProject &&
    deprecatedKeysPresent.length === 0 &&
    (!serviceRole || serviceRole === "service_role");

  return {
    ok,
    projectRef: urlRef,
    url: url ?? null,
    hasAnonKey: Boolean(anonKey),
    hasServiceRoleKey: Boolean(serviceRoleKey),
    sameProject,
    serviceRole,
    deprecatedKeysPresent,
    missing,
    warnings,
  };
}

export function logSupabaseProjectValidation(scope: string): SupabaseProjectValidation {
  const validation = validateSupabaseProject();

  console.log(`[${scope}] Supabase project`, {
    projectRef: validation.projectRef,
    url: validation.url,
    hasAnonKey: validation.hasAnonKey,
    hasServiceRoleKey: validation.hasServiceRoleKey,
    sameProject: validation.sameProject,
    serviceRole: validation.serviceRole,
    deprecatedKeysPresent: validation.deprecatedKeysPresent,
    missing: validation.missing,
  });

  for (const warning of validation.warnings) {
    console.warn(`[${scope}] ${warning}`);
  }

  if (!validation.ok && process.env.NODE_ENV === "production") {
    console.error(`[${scope}] Supabase configuration is invalid`, validation);
  }

  return validation;
}

export function isSupabaseAdminConfigured(): boolean {
  const validation = validateSupabaseProject();
  return validation.ok;
}
