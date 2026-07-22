import type { PlanId } from "@/components/billing/pricing-data";

export type { PlanId };

export type BillingInterval = "monthly" | "yearly";

export type SubscriptionStatus = "active" | "trialing" | "canceled" | "past_due";

export type PlanLimits = {
  /** AI credits allotted per billing cycle (legacy field name kept for compatibility). */
  aiActionsPerMonth: number;
  inboxes: number;
  unlimited: boolean;
};

export type UsageMetrics = {
  /** Credits consumed in the current billing cycle. */
  aiActionsUsed: number;
  inboxesConnected: number;
  /** Credits remaining (Infinity when unlimited). */
  aiCreditsRemaining?: number;
  /** Allotment for the current cycle. */
  aiCreditsAllotment?: number;
  /** Warning band derived from remaining %. */
  aiCreditWarning?: "none" | "low_20" | "critical_10" | "exhausted";
};

export type UserSubscription = {
  userId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodEnd: string;
  usage: UsageMetrics;
  updatedAt: string;
  isTrial: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialExpired: boolean;
};

export type SubscriptionSnapshot = UserSubscription & {
  limits: PlanLimits;
  planName: string;
  trialActive: boolean;
  remainingTrialDays: number;
  remainingTrialHours: number;
  trialProgressPercent: number;
  hasProductAccess: boolean;
};
