export function formatNextResetDate(iso: string | null | undefined): string {
  if (!iso) return "End of billing cycle";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "End of billing cycle";
  }
}

export function formatCredits(value: number | undefined | null): string {
  if (value == null || !Number.isFinite(value)) return "Unlimited";
  return value.toLocaleString("en-IN");
}
