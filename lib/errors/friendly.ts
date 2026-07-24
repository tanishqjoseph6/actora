export type ErrorCategory =
  | "network"
  | "server"
  | "timeout"
  | "payment"
  | "email"
  | "ai"
  | "auth"
  | "credits"
  | "workspace"
  | "generic";

export type FriendlyError = {
  title: string;
  message: string;
};

const CATEGORY_DEFAULTS: Record<ErrorCategory, FriendlyError> = {
  network: {
    title: "Connection issue",
    message: "Check your internet connection and try again.",
  },
  server: {
    title: "Something went wrong",
    message: "We couldn't complete that request. Please try again in a moment.",
  },
  timeout: {
    title: "Request timed out",
    message: "This is taking longer than expected. Please try again.",
  },
  payment: {
    title: "Payment failed",
    message: "Your payment could not be processed. No charges were made.",
  },
  email: {
    title: "Email unavailable",
    message: "We couldn't send or load email right now. Please try again.",
  },
  ai: {
    title: "AI unavailable",
    message: "Roxx AI couldn't complete that request. Please try again.",
  },
  auth: {
    title: "Sign-in required",
    message: "Please sign in again to continue.",
  },
  credits: {
    title: "AI credits exhausted",
    message: "Upgrade your plan or purchase credits to keep using Roxx AI.",
  },
  workspace: {
    title: "Workspace access denied",
    message: "You don't have permission to perform this action in this workspace.",
  },
  generic: {
    title: "Something went wrong",
    message: "Please try again. If the problem continues, contact support.",
  },
};

function extractRawMessage(error: unknown): string {
  if (typeof error === "string") return error.trim();
  if (error instanceof Error) return error.message.trim();
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === "string") return msg.trim();
  }
  return "";
}

function inferCategory(raw: string, fallback: ErrorCategory): ErrorCategory {
  const lower = raw.toLowerCase();

  if (
    lower.includes("network") ||
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("offline")
  ) {
    return "network";
  }
  if (lower.includes("timeout") || lower.includes("timed out")) return "timeout";
  if (lower.includes("payment") || lower.includes("razorpay")) return "payment";
  if (lower.includes("credit") || lower.includes("quota")) return "credits";
  if (
    lower.includes("unauthorized") ||
    lower.includes("unauthenticated") ||
    lower.includes("sign in") ||
    lower.includes("session")
  ) {
    return "auth";
  }
  if (
    lower.includes("forbidden") ||
    lower.includes("permission") ||
    lower.includes("workspace")
  ) {
    return "workspace";
  }
  if (lower.includes("openai") || lower.includes("ai ") || lower.includes("roxx")) {
    return "ai";
  }
  if (lower.includes("email") || lower.includes("gmail") || lower.includes("resend")) {
    return "email";
  }
  if (lower.includes("500") || lower.includes("internal")) return "server";

  return fallback;
}

/** Maps backend / thrown errors to user-safe copy — never expose raw API messages. */
export function friendlyError(
  error: unknown,
  category: ErrorCategory = "generic"
): FriendlyError {
  const raw = extractRawMessage(error);
  const resolved = raw ? inferCategory(raw, category) : category;
  return CATEGORY_DEFAULTS[resolved];
}

export function friendlyErrorMessage(
  error: unknown,
  category: ErrorCategory = "generic"
): string {
  return friendlyError(error, category).message;
}
