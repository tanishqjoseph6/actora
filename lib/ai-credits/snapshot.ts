import { resolveCreditCycle } from "@/lib/ai-credits/consume";
import { computeMonthlyPercentUsed } from "@/lib/ai-credits/milestones";
import { isUnlimited } from "@/lib/subscription/plans";
import type { PlanId } from "@/lib/subscription/types";
import { getUserUsage } from "@/lib/dashboard/user-usage";

export type AiCreditSnapshot = {
  planId: PlanId;
  cycleKey: string;
  used: number;
  remaining: number;
  totalMonthly: number;
  monthlyRemaining: number;
  purchasedRemaining: number;
  nextResetDate: string | null;
  percentUsed: number;
  unlimited: boolean;
};

/**
 * Authoritative server-side AI credit snapshot — never trust client math.
 */
export async function getAiCreditSnapshot(
  userId: string
): Promise<AiCreditSnapshot> {
  const cycle = await resolveCreditCycle(userId);
  const usage = await getUserUsage(userId, {
    cycleKey: cycle.cycleKey,
    periodStart: cycle.periodStart,
    periodEnd: cycle.periodEnd,
    allotment: cycle.allotment,
  });

  const totalMonthly =
    usage.aiCreditsAllotment ||
    cycle.allotment ||
    0;
  const unlimited = isUnlimited(totalMonthly);
  const monthlyUsed = usage.aiActionsUsed;
  const monthlyRemaining = unlimited
    ? Number.POSITIVE_INFINITY
    : Math.max(0, totalMonthly - monthlyUsed);
  const purchasedRemaining = Math.max(0, usage.purchasedCreditsRemaining);
  const remaining = unlimited
    ? Number.POSITIVE_INFINITY
    : monthlyRemaining + purchasedRemaining;

  return {
    planId: cycle.planId,
    cycleKey: cycle.cycleKey,
    used: monthlyUsed,
    remaining,
    totalMonthly: unlimited ? totalMonthly : totalMonthly,
    monthlyRemaining,
    purchasedRemaining,
    nextResetDate: usage.periodEnd ?? cycle.periodEnd,
    percentUsed: unlimited
      ? 0
      : computeMonthlyPercentUsed(monthlyUsed, totalMonthly),
    unlimited,
  };
}
