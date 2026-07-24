import "server-only";

import { getEmailVerificationRedirectUrl } from "@/lib/auth/email-verification";
import { getPasswordResetRedirectUrl } from "@/lib/auth/password-reset";
import { requireSupabaseAdmin } from "@/lib/supabase-admin";
import { sendProductionEmail } from "@/lib/email/send";
import {
  buildEmailVerificationEmail,
  buildPasswordResetEmail,
} from "@/lib/email/templates/auth";

export async function sendPasswordResetEmail(
  email: string
): Promise<{ sent: boolean; skipped?: string; error?: string }> {
  const normalized = email.trim().toLowerCase();
  const supabase = requireSupabaseAdmin();

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: normalized,
    options: { redirectTo: getPasswordResetRedirectUrl() },
  });

  if (error) {
    return { sent: false, error: error.message };
  }

  const actionLink = data.properties?.action_link;
  if (!actionLink) {
    return { sent: false, error: "Could not generate password reset link." };
  }

  const template = buildPasswordResetEmail(actionLink);
  return sendProductionEmail({
    to: normalized,
    subject: template.subject,
    html: template.html,
    text: template.text,
    category: "auth_password_reset",
    tags: [{ name: "category", value: "password_reset" }],
  });
}

export async function sendVerificationEmail(
  email: string,
  options?: { password?: string }
): Promise<{ sent: boolean; skipped?: string; error?: string }> {
  const normalized = email.trim().toLowerCase();
  const supabase = requireSupabaseAdmin();
  const redirectTo = getEmailVerificationRedirectUrl();

  const { data, error } = options?.password
    ? await supabase.auth.admin.generateLink({
        type: "signup",
        email: normalized,
        password: options.password,
        options: { redirectTo },
      })
    : await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: normalized,
        options: { redirectTo },
      });

  if (error) {
    return { sent: false, error: error.message };
  }

  const actionLink = data.properties?.action_link;
  if (!actionLink) {
    return { sent: false, error: "Could not generate verification link." };
  }

  const template = buildEmailVerificationEmail(actionLink);
  return sendProductionEmail({
    to: normalized,
    subject: template.subject,
    html: template.html,
    text: template.text,
    category: "auth_verification",
    tags: [{ name: "category", value: "email_verification" }],
  });
}
