import type { PlanId, PlanLimits, UsageMetrics } from "./types";
import { getPlanLimits, isUnlimited } from "./plans";

export type FeatureGateResult =
  | { allowed: true }
  | { allowed: false; reason: string };

export function canUseAiAction(
  planId: PlanId,
  usage: UsageMetrics
): FeatureGateResult {
  const limits = getPlanLimits(planId);

  if (isUnlimited(limits.aiActionsPerMonth)) {
    return { allowed: true };
  }

  if (usage.aiActionsUsed >= limits.aiActionsPerMonth) {
    return {
      allowed: false,
      reason: `You've reached your ${limits.aiActionsPerMonth} AI action limit for this month. Upgrade to continue.`,
    };
  }

  return { allowed: true };
}

export function canConnectInbox(
  planId: PlanId,
  usage: UsageMetrics
): FeatureGateResult {
  const limits = getPlanLimits(planId);

  if (isUnlimited(limits.inboxes)) {
    return { allowed: true };
  }

  if (usage.inboxesConnected >= limits.inboxes) {
    return {
      allowed: false,
      reason: `Your plan allows ${limits.inboxes} inbox. Upgrade to connect more.`,
    };
  }

  return { allowed: true };
}

export function getUsagePercent(used: number, limit: number): number {
  if (isUnlimited(limit)) return 0;
  if (limit === 0) return 100;
  return Math.min((used / limit) * 100, 100);
}

export function hasFeatureAccess(
  planId: PlanId,
  feature: keyof PlanLimits
): boolean {
  const limits = getPlanLimits(planId);

  if (feature === "unlimited") {
    return limits.unlimited;
  }

  return isUnlimited(limits[feature]) || limits[feature] > 0;
}
