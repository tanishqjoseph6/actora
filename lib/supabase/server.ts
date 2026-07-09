import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;
let adminClientUrl: string | null = null;

function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

/** Warn if the configured key does not look like a Supabase service_role JWT. */
function assertServiceRoleKey(key: string): void {
  try {
    const parts = key.split(".");
    if (parts.length < 2) return;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8")
    ) as { role?: string };

    if (payload.role && payload.role !== "service_role") {
      console.error(
        "[supabase] SUPABASE_SERVICE_ROLE_KEY has role",
        payload.role,
        "— expected service_role. Webhook/subscription writes will fail under RLS."
      );
    }
  } catch {
    // Non-JWT keys are unusual but do not block client creation.
  }
}

export function isSupabaseNetworkError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("fetch failed") ||
    lower.includes("econnrefused") ||
    lower.includes("enotfound") ||
    lower.includes("etimedout") ||
    lower.includes("network")
  );
}

export function isMissingRazorpayColumnError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("razorpay_subscription_id") ||
    lower.includes("razorpay_plan_id")
  );
}

/**
 * Server-only Supabase client with service role for automation persistence.
 * Uses the same @supabase/supabase-js package as lib/supabase.ts.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceKey = trimEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url || !serviceKey) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[supabase] Admin client unavailable in production. Missing:",
        !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
        !serviceKey ? "SUPABASE_SERVICE_ROLE_KEY" : null
      );
    }
    return null;
  }

  assertServiceRoleKey(serviceKey);

  if (!adminClient || adminClientUrl !== url) {
    adminClient = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: "public",
      },
      global: {
        headers: {
          "X-Client-Info": "actora-service-role",
        },
      },
    });
    adminClientUrl = url;
  }

  return adminClient;
}

/** Service-role client for writes that must persist (billing, etc.). Throws if misconfigured. */
export function requireSupabaseAdmin(): SupabaseClient {
  const db = getSupabaseAdmin();
  if (db) return db;

  const missing: string[] = [];
  if (!trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!trimEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  const message = `[supabase] Service role client required but unavailable. Missing: ${missing.join(", ")}`;
  console.error(message);
  throw new Error(message);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      trimEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

/** True when PostgREST reports the automations schema is missing. */
export function isMissingAutomationSchemaError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("does not exist") ||
    lower.includes("could not find the table") ||
    lower.includes("schema cache") ||
    lower.includes("pgrst205")
  );
}

/** True when PostgREST reports the gmail_accounts schema is missing. */
export function isMissingGmailSchemaError(message: string): boolean {
  return isMissingTableSchemaError(message, "gmail_accounts");
}

/** True when PostgREST reports the user_usage schema is missing. */
export function isMissingUserUsageSchemaError(message: string): boolean {
  return isMissingTableSchemaError(message, "user_usage");
}

/** True when PostgREST reports the user_subscriptions schema is missing. */
export function isMissingUserSubscriptionsSchemaError(message: string): boolean {
  return isMissingTableSchemaError(message, "user_subscriptions");
}

function isMissingTableSchemaError(message: string, table: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes(table) &&
    (lower.includes("does not exist") ||
      lower.includes("could not find the table") ||
      lower.includes("schema cache") ||
      lower.includes("pgrst205"))
  );
}
