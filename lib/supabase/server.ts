import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  extractJwtRole,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  isSupabaseAdminConfigured,
  SUPABASE_ENV,
  trimEnv,
} from "./config";

let adminClient: SupabaseClient | null = null;
let adminClientUrl: string | null = null;
let adminClientKey: string | null = null;

/** Warn if the configured key does not look like a Supabase service_role JWT. */
function assertServiceRoleKey(key: string): void {
  const role = extractJwtRole(key);
  if (role && role !== "service_role") {
    console.error(
      `[supabase] ${SUPABASE_ENV.SERVICE_ROLE_KEY} has role`,
      role,
      "— expected service_role. Database writes will fail under RLS."
    );
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
 * Server-only Supabase client with service role for database persistence.
 * Reads only NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();

  if (!url || !serviceKey) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[supabase] Admin client unavailable in production. Missing:",
        !url ? SUPABASE_ENV.URL : null,
        !serviceKey ? SUPABASE_ENV.SERVICE_ROLE_KEY : null
      );
    }
    return null;
  }

  assertServiceRoleKey(serviceKey);

  if (
    !adminClient ||
    adminClientUrl !== url ||
    adminClientKey !== serviceKey
  ) {
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
    adminClientKey = serviceKey;
  }

  return adminClient;
}

/** Service-role client for writes that must persist. Throws if misconfigured. */
export function requireSupabaseAdmin(): SupabaseClient {
  const db = getSupabaseAdmin();
  if (db) return db;

  const missing: string[] = [];
  if (!trimEnv(process.env[SUPABASE_ENV.URL])) {
    missing.push(SUPABASE_ENV.URL);
  }
  if (!trimEnv(process.env[SUPABASE_ENV.SERVICE_ROLE_KEY])) {
    missing.push(SUPABASE_ENV.SERVICE_ROLE_KEY);
  }

  const message = `[supabase] Service role client required but unavailable. Missing: ${missing.join(", ")}`;
  console.error(message);
  throw new Error(message);
}

export function isSupabaseConfigured(): boolean {
  return isSupabaseAdminConfigured();
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

/** True when PostgREST reports the waitlist_notifications schema is missing. */
export function isMissingWaitlistSchemaError(message: string): boolean {
  return isMissingTableSchemaError(message, "waitlist_notifications");
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
