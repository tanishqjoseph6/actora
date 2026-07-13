export type { PlanId } from "./types";
export type {
  BillingInterval,
  PlanLimits,
  SubscriptionSnapshot,
  SubscriptionStatus,
  UsageMetrics,
  UserSubscription,
} from "./types";

export {
  DEFAULT_PLAN_ID,
  PLAN_LIMITS,
  PLAN_DISPLAY_NAMES,
  formatLimit,
  getPlanBadgeStyles,
  getPlanDisplayName,
  getPlanLimits,
  isUnlimited,
} from "./plans";

export {
  canConnectInbox,
  canUseAiAction,
  canAccessFeature,
  getUpgradeRecommendation,
  getUsagePercent,
  hasFeatureAccess,
  isPlanLimitError,
} from "./gates";

export type { PlanFeature, PlanFeatureFlags } from "./features";
export {
  FEATURE_META,
  PLAN_FEATURES,
  getFeatureUpgradePlan,
  getPlanFeatures,
  hasPlanFeature,
} from "./features";

export type { FeatureGateResult, LimitType } from "./gates";

export {
  createDefaultSubscription,
  subscriptionProvider,
  toSubscriptionSnapshot,
} from "./provider";

export type { SubscriptionUpsertMetadata } from "./repository";
export {
  upsertUserSubscription,
  startTrialSubscription,
  expireTrialIfNeeded,
} from "./repository";

export type { SubscriptionProvider } from "./provider";

export {
  isTrialActive,
  hasTrialExpired,
  getRemainingTrialDays,
  getRemainingTrialHours,
  hasProductAccess,
  TRIAL_DURATION_DAYS,
} from "@/lib/trial/helpers";
