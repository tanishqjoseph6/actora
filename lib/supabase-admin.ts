export {
  getSupabaseAdmin,
  requireSupabaseAdmin,
  isSupabaseConfigured,
  isSupabaseNetworkError,
  isMissingRazorpayColumnError,
  isMissingAutomationSchemaError,
  isMissingGmailSchemaError,
  isMissingUserUsageSchemaError,
  isMissingUserSubscriptionsSchemaError,
  isMissingWaitlistSchemaError,
  isMissingCrmSchemaError,
} from "./supabase/server";

export {
  SUPABASE_ENV,
  validateSupabaseProject,
  logSupabaseProjectValidation,
  getSupabaseUrl,
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
} from "./supabase/config";

export { createSupabaseAnonClient } from "./supabase/create-anon-client";
export { getSupabaseBrowserClient, supabase } from "./supabase/client";
