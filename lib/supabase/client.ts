import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  createSupabaseAnonClientOptions,
} from "./create-anon-client";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  SUPABASE_ENV,
} from "./config";

let browserClient: SupabaseClient | null = null;
let browserClientUrl: string | null = null;
let browserClientAnonKey: string | null = null;

/**
 * Browser / client-component Supabase client (anon key).
 * Reads only NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error(
      `Supabase browser client requires ${SUPABASE_ENV.URL} and ${SUPABASE_ENV.ANON_KEY}.`
    );
  }

  if (
    !browserClient ||
    browserClientUrl !== url ||
    browserClientAnonKey !== anonKey
  ) {
    browserClient = createClient(url, anonKey, createSupabaseAnonClientOptions(true));
    browserClientUrl = url;
    browserClientAnonKey = anonKey;
  }

  return browserClient;
}

/** @deprecated Prefer getSupabaseBrowserClient — kept for existing imports. */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseBrowserClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
