/** Canonical user_id for subscription rows (NextAuth email). */
export function normalizeSubscriptionUserId(email: string): string {
  return email.trim().toLowerCase();
}
