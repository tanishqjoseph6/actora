import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  SUPABASE_ENV,
} from "./config";

export function createSupabaseAnonClientOptions(persistSession: boolean) {
  return {
    auth: {
      persistSession,
      autoRefreshToken: persistSession,
      detectSessionInUrl: persistSession,
    },
  } as const;
}

/** Server or browser anon client — never uses the service role key. */
export function createSupabaseAnonClient(options?: {
  persistSession?: boolean;
}): SupabaseClient {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error(
      `Missing ${SUPABASE_ENV.URL} or ${SUPABASE_ENV.ANON_KEY} for Supabase anon client.`
    );
  }

  const persistSession = options?.persistSession ?? false;

  return createClient(
    url,
    anonKey,
    createSupabaseAnonClientOptions(persistSession)
  );
}
