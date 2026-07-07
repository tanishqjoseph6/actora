import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;
let adminClientUrl: string | null = null;

/**
 * Server-only Supabase client with service role for automation persistence.
 * Uses the same @supabase/supabase-js package as lib/supabase.ts.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  if (!adminClient || adminClientUrl !== url) {
    adminClient = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    adminClientUrl = url;
  }

  return adminClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
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
