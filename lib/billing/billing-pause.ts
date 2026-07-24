/**
 * Temporary frontend kill-switch for billing / checkout / upgrades.
 * Set NEXT_PUBLIC_BILLING_PAUSED=true to disable checkout in staging.
 */
export const BILLING_TEMPORARILY_DISABLED =
  process.env.NEXT_PUBLIC_BILLING_PAUSED === "true";
