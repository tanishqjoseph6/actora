import type { PlanId, PlanLimits, UsageMetrics } from "./types";
import {
  FEATURE_META,
  getFeatureUpgradePlan,
  hasPlanFeature,
  type PlanFeature,
} from "./features";
import { getPlanLimits, getPlanDisplayName, isUnlimited } from "./plans";

export type LimitType = "ai_actions" | "inboxes" | "feature";

export type FeatureGateResult =
  | { allowed: true }
  | {
      allowed: false;
      reason: string;
      limitType: LimitType;
      feature?: PlanFeature;
      recommendedPlan: PlanId;
    };

export function getUpgradeRecommendation(
  planId: PlanId,
  feature?: PlanFeature
): PlanId {
  if (feature) {
    return getFeatureUpgradePlan(feature);
  }
  if (planId === "free") return "pro";
  if (planId === "pro") return "starter";
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
      recommendedPlan: "pro",
      reason: `You've used all ${limits.aiActionsPerMonth} AI actions for this month. Upgrade to Pro for unlimited AI actions.`,
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
      recommendedPlan: "pro",
      reason: `Your Free plan includes ${limits.inboxes} Gmail account. Upgrade to Pro for unlimited inboxes.`,
    };
  }

  return { allowed: true };
}

export function canAccessFeature(
  planId: PlanId,
  feature: PlanFeature
): FeatureGateResult {
  if (hasPlanFeature(planId, feature)) {
    return { allowed: true };
  }

  const recommendedPlan = getFeatureUpgradePlan(feature);
  const planName = getPlanDisplayName(recommendedPlan);
  const { label } = FEATURE_META[feature];

  const reason =
    recommendedPlan === "starter"
      ? `${label} is available on the Team plan. Upgrade to collaborate with shared inboxes and team workspace.`
      : `${label} requires Pro or above. Upgrade to unlock this feature on your workspace.`;

  return {
    allowed: false,
    limitType: "feature",
    feature,
    recommendedPlan,
    reason,
  };
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
): payload is {
  code: "PLAN_LIMIT";
  limitType: LimitType;
  error: string;
} {
  return (
    typeof payload === "object" &&
    payload !== null &&
    (payload as { code?: string }).code === "PLAN_LIMIT"
  );
}
