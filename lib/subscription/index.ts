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
  getPlanDisplayName,
  getPlanLimits,
  isUnlimited,
} from "./plans";

export {
  canConnectInbox,
  canUseAiAction,
  getUsagePercent,
  hasFeatureAccess,
} from "./gates";

export type { FeatureGateResult } from "./gates";

export {
  createDefaultSubscription,
  subscriptionProvider,
  syncSubscriptionFromWebhook,
  toSubscriptionSnapshot,
} from "./provider";

export type { SubscriptionProvider } from "./provider";
