import { getSiteUrl } from "@/lib/site";

export function getPasswordResetRedirectUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/reset-password`;
  }
  return `${getSiteUrl()}/reset-password`;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Incorrect email or password.",
  "Email not confirmed": "Please confirm your email before signing in.",
  "User not found": "No account found with that email address.",
  "For security purposes, you can only request this once every 60 seconds":
    "Please wait a minute before requesting another email.",
  "email rate limit exceeded":
    "Too many emails were sent. Please wait a few minutes and try again.",
  over_email_send_rate_limit:
    "Too many emails were sent. Please wait a few minutes and try again.",
  "Email address is invalid": "That email address is not valid. Use a real inbox address.",
  email_address_invalid:
    "That email address is not valid. Use a real inbox address.",
  "User already registered":
    "An account with this email already exists. Try signing in.",
  user_already_registered:
    "An account with this email already exists. Try signing in.",
  "Signup is disabled":
    "New account signup is currently disabled. Contact support.",
  signup_disabled:
    "New account signup is currently disabled. Contact support.",
  "Password should be at least 6 characters":
    "Password is too short. Use at least 8 characters.",
  weak_password: "Password is too weak. Use at least 8 characters.",
};

export function mapSupabaseAuthError(
  message: string,
  code?: string | null
): string {
  if (code && AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code];
  }
  return AUTH_ERROR_MESSAGES[message] ?? message;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  return null;
}

export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): string | null {
  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }
  return null;
}
