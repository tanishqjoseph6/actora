import type { User } from "@supabase/supabase-js";
import { getSiteUrl } from "@/lib/site";

export function getEmailVerificationRedirectUrl(): string {
  return `${getSiteUrl()}/verify-email`;
}

export function isEmailVerified(user: User | null | undefined): boolean {
  if (!user) return false;
  return Boolean(user.email_confirmed_at);
}

export type VerificationStatus = "pending" | "verifying" | "verified" | "error";

const VERIFICATION_ERROR_MESSAGES: Record<string, string> = {
  "Email not confirmed": "Please verify your email before signing in.",
  "For security purposes, you can only request this once every 60 seconds":
    "Please wait a minute before requesting another verification email.",
};

export function mapVerificationError(message: string): string {
  return VERIFICATION_ERROR_MESSAGES[message] ?? message;
}
