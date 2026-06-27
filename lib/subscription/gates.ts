import type { PlanId, PlanLimits, UsageMetrics } from "./types";
import { getPlanLimits, isUnlimited } from "./plans";

export type LimitType = "ai_actions" | "inboxes";

export type FeatureGateResult =
  | { allowed: true }
  | { allowed: false; reason: string; limitType: LimitType };

export function getUpgradeRecommendation(planId: PlanId): PlanId {
  if (planId === "free") return "starter";
  if (planId === "starter") return "pro";
  return "pro";
}

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
      limitType: "ai_actions",
      reason: `You've used all ${limits.aiActionsPerMonth} AI actions for this month. Upgrade your plan to keep automating your inbox.`,
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
      limitType: "inboxes",
      reason: `Your ${planId === "free" ? "Free" : "Starter"} plan includes ${limits.inboxes} inbox. Upgrade to connect more accounts.`,
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

export function isPlanLimitError(
  payload: unknown
): payload is { code: "PLAN_LIMIT"; limitType: LimitType; error: string } {
  return (
    typeof payload === "object" &&
    payload !== null &&
    (payload as { code?: string }).code === "PLAN_LIMIT"
  );
}
