import { getSiteUrl } from "@/lib/site";

/**
 * Prefer the current browser origin so verification links match the deployment
 * the user is on (localhost vs production). Fall back to the configured site URL
 * for server-side calls.
 */
export function getEmailVerificationRedirectUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/verify-email`;
  }
  return `${getSiteUrl()}/verify-email`;
}

export function isEmailVerified(user: {
  email_confirmed_at?: string | null;
} | null | undefined): boolean {
  if (!user) return false;
  return Boolean(user.email_confirmed_at);
}

export type VerificationStatus = "pending" | "verifying" | "verified" | "error";

const VERIFICATION_ERROR_MESSAGES: Record<string, string> = {
  "Email not confirmed": "Please verify your email before signing in.",
  "For security purposes, you can only request this once every 60 seconds":
    "Please wait a minute before requesting another verification email.",
  "email rate limit exceeded":
    "Too many verification emails were sent. Please wait a few minutes and try again.",
  over_email_send_rate_limit:
    "Too many verification emails were sent. Please wait a few minutes and try again.",
};

export function mapVerificationError(
  message: string,
  code?: string | null
): string {
  if (code && VERIFICATION_ERROR_MESSAGES[code]) {
    return VERIFICATION_ERROR_MESSAGES[code];
  }
  return VERIFICATION_ERROR_MESSAGES[message] ?? message;
}
