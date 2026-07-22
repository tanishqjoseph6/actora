import type { PlanId } from "@/lib/subscription/types";
import { getPlanLimits, isUnlimited } from "@/lib/subscription/plans";

export type CreditWarningLevel = "none" | "low_20" | "critical_10" | "exhausted";

export type CreditBalanceView = {
  used: number;
  allotment: number;
  remaining: number;
  percentUsed: number;
  percentRemaining: number;
  unlimited: boolean;
  warning: CreditWarningLevel;
};

export function getCreditAllotment(planId: PlanId): number {
  return getPlanLimits(planId).aiActionsPerMonth;
}

export function computeCreditBalance(
  used: number,
  allotment: number
): CreditBalanceView {
  const unlimited = isUnlimited(allotment);
  if (unlimited) {
    return {
      used,
      allotment,
      remaining: Number.POSITIVE_INFINITY,
      percentUsed: 0,
      percentRemaining: 100,
      unlimited: true,
      warning: "none",
    };
  }

  const safeUsed = Math.max(0, used);
  const safeAllotment = Math.max(0, allotment);
  const remaining = Math.max(0, safeAllotment - safeUsed);
  const percentUsed =
    safeAllotment === 0 ? 100 : Math.min(100, (safeUsed / safeAllotment) * 100);
  const percentRemaining = Math.max(0, 100 - percentUsed);

  let warning: CreditWarningLevel = "none";
  if (remaining <= 0) warning = "exhausted";
  else if (percentRemaining <= 10) warning = "critical_10";
  else if (percentRemaining <= 20) warning = "low_20";

  return {
    used: safeUsed,
    allotment: safeAllotment,
    remaining,
    percentUsed,
    percentRemaining,
    unlimited: false,
    warning,
  };
}
