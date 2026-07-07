import { getSiteUrl } from "@/lib/site";

export function getPasswordResetRedirectUrl(): string {
  return `${getSiteUrl()}/reset-password`;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Incorrect email or password.",
  "Email not confirmed": "Please confirm your email before signing in.",
  "User not found": "No account found with that email address.",
  "For security purposes, you can only request this once every 60 seconds":
    "Please wait a minute before requesting another reset email.",
};

export function mapSupabaseAuthError(message: string): string {
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
