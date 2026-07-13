import type { PlanId, SubscriptionStatus } from "@/lib/subscription/types";

export const TRIAL_DURATION_DAYS = 14;

export type TrialFields = {
  isTrial: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialExpired: boolean;
};

export type TrialSnapshot = TrialFields & {
  planId: PlanId;
  status: SubscriptionStatus;
  remainingDays: number;
  remainingHours: number;
  progressPercent: number;
  trialActive: boolean;
};

/** Server-time check: trial window is still open. */
export function isTrialActive(fields: TrialFields, now = new Date()): boolean {
  if (!fields.isTrial || fields.trialExpired) return false;
  if (!fields.trialEndsAt) return false;
  return new Date(fields.trialEndsAt).getTime() > now.getTime();
}

/** Server-time check: trial has ended (or was marked expired). */
export function hasTrialExpired(fields: TrialFields, now = new Date()): boolean {
  if (fields.trialExpired) return true;
  if (!fields.isTrial || !fields.trialEndsAt) return false;
  return new Date(fields.trialEndsAt).getTime() <= now.getTime();
}

export function getRemainingTrialDays(
  fields: TrialFields,
  now = new Date()
): number {
  if (!isTrialActive(fields, now) || !fields.trialEndsAt) return 0;
  const ms = new Date(fields.trialEndsAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function getRemainingTrialHours(
  fields: TrialFields,
  now = new Date()
): number {
  if (!isTrialActive(fields, now) || !fields.trialEndsAt) return 0;
  const ms = new Date(fields.trialEndsAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (60 * 60 * 1000)));
}

export function getTrialProgressPercent(
  fields: TrialFields,
  now = new Date()
): number {
  if (!fields.trialStartedAt || !fields.trialEndsAt) return 0;
  const start = new Date(fields.trialStartedAt).getTime();
  const end = new Date(fields.trialEndsAt).getTime();
  if (end <= start) return 100;
  const elapsed = now.getTime() - start;
  return Math.min(100, Math.max(0, Math.round((elapsed / (end - start)) * 100)));
}

export function computeTrialEndsAt(
  startedAt: Date = new Date(),
  days = TRIAL_DURATION_DAYS
): Date {
  const end = new Date(startedAt);
  end.setUTCDate(end.getUTCDate() + days);
  return end;
}

export function isPaidPlanId(planId: PlanId): boolean {
  return planId === "pro" || planId === "starter" || planId === "enterprise";
}

/**
 * Access rule for authenticated product routes:
 * paid active plan OR active trial → allowed.
 * Expired trial (and free without access) → blocked.
 */
export function hasProductAccess(input: {
  planId: PlanId;
  status: SubscriptionStatus;
  trial: TrialFields;
  now?: Date;
}): boolean {
  const now = input.now ?? new Date();

  if (isPaidPlanId(input.planId) && input.status === "active") {
    return true;
  }

  if (isTrialActive(input.trial, now)) {
    return true;
  }

  // Legacy free users who never started a trial keep limited free access.
  if (
    input.planId === "free" &&
    !input.trial.isTrial &&
    !input.trial.trialExpired
  ) {
    return true;
  }

  return false;
}

export function buildTrialSnapshot(
  planId: PlanId,
  status: SubscriptionStatus,
  fields: TrialFields,
  now = new Date()
): TrialSnapshot {
  const trialActive = isTrialActive(fields, now);
  return {
    ...fields,
    planId,
    status,
    remainingDays: getRemainingTrialDays(fields, now),
    remainingHours: getRemainingTrialHours(fields, now),
    progressPercent: getTrialProgressPercent(fields, now),
    trialActive,
  };
}

export function emptyTrialFields(): TrialFields {
  return {
    isTrial: false,
    trialStartedAt: null,
    trialEndsAt: null,
    trialExpired: false,
  };
}
