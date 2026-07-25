import "server-only";

import { cookies } from "next/headers";
import { OAUTH_ERROR_COOKIE } from "@/lib/auth/oauth-error-cookie";

export { OAUTH_ERROR_COOKIE };

/** Extract a human-readable message + stack from NextAuth logger metadata. */
export function extractAuthException(metadata: unknown): {
  message: string;
  stack: string | null;
  name: string | null;
} {
  const payload =
    metadata && typeof metadata === "object"
      ? (metadata as Record<string, unknown>)
      : null;

  const error = payload?.error;
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? null,
    };
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const message =
      typeof record.message === "string"
        ? record.message
        : typeof record.error_description === "string"
          ? record.error_description
          : JSON.stringify(record);
    return {
      name: typeof record.name === "string" ? record.name : null,
      message,
      stack: typeof record.stack === "string" ? record.stack : null,
    };
  }

  if (typeof metadata === "string") {
    return { name: null, message: metadata, stack: null };
  }

  return {
    name: null,
    message: metadata == null ? "Unknown auth error" : JSON.stringify(metadata),
    stack: null,
  };
}

/**
 * Persist the last OAuth failure on a readable cookie so /login can show the
 * exact exception instead of a generic OAuthCallback code.
 */
export async function persistOAuthErrorForClient(message: string): Promise<void> {
  try {
    const store = await cookies();
    store.set(OAUTH_ERROR_COOKIE, message.slice(0, 500), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 120,
    });
  } catch (error) {
    console.error("[next-auth] Failed to persist OAuth error cookie", error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
  }
}
