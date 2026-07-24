import { getStoredSubscription } from "@/lib/subscription/repository";
import { getPlanLimits } from "@/lib/subscription/plans";
import type { PlanId } from "@/lib/subscription/types";

function startOfUtcDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Resolve billing-cycle boundaries for credit reset.
 * Prefer subscription period; fall back to trial window; else calendar month.
 */
export async function resolveCreditCycle(userId: string): Promise<{
  planId: PlanId;
  allotment: number;
  cycleKey: string;
  periodStart: string;
  periodEnd: string | null;
}> {
  const stored = await getStoredSubscription(userId);
  const planId = (stored?.planId ?? "free") as PlanId;
  const limits = getPlanLimits(planId);
  const allotment = limits.aiActionsPerMonth;

  if (stored?.isTrial && stored.trialStartedAt && stored.trialEndsAt) {
    const start = new Date(stored.trialStartedAt);
    return {
      planId,
      allotment,
      cycleKey: `trial:${stored.trialStartedAt}`,
      periodStart: startOfUtcDay(start),
      periodEnd: stored.trialEndsAt,
    };
  }

  if (stored?.currentPeriodEnd) {
    const end = new Date(stored.currentPeriodEnd);
    const start = new Date(end);
    if (stored.billingInterval === "yearly") {
      start.setFullYear(start.getFullYear() - 1);
    } else {
      start.setMonth(start.getMonth() - 1);
    }
    return {
      planId,
      allotment,
      cycleKey: `sub:${stored.currentPeriodEnd}`,
      periodStart: startOfUtcDay(start),
      periodEnd: stored.currentPeriodEnd,
    };
  }

  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  const monthEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );
  return {
    planId,
    allotment,
    cycleKey: `cal:${monthStart.toISOString().slice(0, 10)}`,
    periodStart: startOfUtcDay(monthStart),
    periodEnd: monthEnd.toISOString(),
  };
}
