import "server-only";

import { requireSupabaseAdmin } from "@/lib/supabase-admin";
import type {
  SendProductionEmailInput,
  SendProductionEmailResult,
} from "./types";

/**
 * Send production email via Supabase Edge Function `send-email`.
 * Resend API key lives in Supabase Edge Function secrets — never in Next.js env.
 */
export async function sendProductionEmail(
  input: SendProductionEmailInput
): Promise<SendProductionEmailResult> {
  const category = input.category ?? "general";

  try {
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        tags: input.tags,
      },
    });

    if (error) {
      console.error(`[email/${category}] edge invoke failed:`, error.message);
      return { sent: false, error: error.message };
    }

    const payload = data as
      | { sent?: boolean; id?: string | null; skipped?: string; error?: string }
      | null;

    if (payload?.skipped === "missing_resend_api_key") {
      console.warn(
        `[email/${category}] RESEND_API_KEY missing in Edge Function secrets`
      );
      return { sent: false, skipped: "missing_resend_api_key" };
    }

    if (payload?.error) {
      console.error(`[email/${category}] send failed:`, payload.error);
      return { sent: false, error: payload.error };
    }

    if (payload?.sent) {
      return { sent: true, id: payload.id ?? null };
    }

    return { sent: false, error: "Unknown send-email response." };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email send failed.";
    console.error(`[email/${category}] unexpected error:`, message);
    return { sent: false, error: message };
  }
}
