/** Validate a post-login redirect target (same-origin relative path only). */
export function resolveSafeCallbackUrl(
  callbackUrl: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!callbackUrl) return fallback;

  const trimmed = callbackUrl.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  if (trimmed.includes("://") || trimmed.includes("\\")) {
    return fallback;
  }

  return trimmed;
}
