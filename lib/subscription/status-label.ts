import type { PlanId, SubscriptionStatus } from "./types";
import { isPaidPlanId } from "@/lib/trial/helpers";

/**
 * UI status for the current plan badge / billing overview.
 * Cancelled paid plans stay "Cancelling" (or "Active") until current_period_end.
 * "Expired" only after the period has actually ended (or trial ended on free).
 */
export function getSubscriptionStatusLabel(input: {
  status: SubscriptionStatus;
  planId: PlanId;
  currentPeriodEnd?: string | null;
  trialActive?: boolean;
  remainingTrialDays?: number;
  trialExpired?: boolean;
  now?: Date;
}): string {
  const now = input.now ?? new Date();

  if (input.trialActive) {
    return `${input.remainingTrialDays ?? 0}d left`;
  }

  const periodEndMs = input.currentPeriodEnd
    ? new Date(input.currentPeriodEnd).getTime()
    : Number.NaN;
  const periodStillActive =
    Number.isFinite(periodEndMs) && periodEndMs > now.getTime();

  if (input.status === "canceled") {
    return periodStillActive ? "Cancelling" : "Expired";
  }

  if (input.status === "past_due") {
    return periodStillActive ? "Past due" : "Expired";
  }

  // Historical trialExpired must not override an active paid (or free) plan.
  if (
    input.trialExpired &&
    !isPaidPlanId(input.planId) &&
    (input.planId === "free" || input.planId === "trial")
  ) {
    return "Expired";
  }

  return "Active";
}

/** Human-readable hint under Current Plan in billing overview. */
export function getSubscriptionStatusHint(input: {
  status: SubscriptionStatus;
  planId: PlanId;
  currentPeriodEnd?: string | null;
  trialActive?: boolean;
  remainingTrialDays?: number;
  trialExpired?: boolean;
  now?: Date;
}): string {
  return getSubscriptionStatusLabel(input);
}
