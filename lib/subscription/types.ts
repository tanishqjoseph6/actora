import type { PlanId } from "@/components/billing/pricing-data";

export type { PlanId };

export type BillingInterval = "monthly" | "yearly";

export type SubscriptionStatus = "active" | "trialing" | "canceled" | "past_due";

export type PlanLimits = {
  aiActionsPerMonth: number;
  inboxes: number;
  unlimited: boolean;
};

export type UsageMetrics = {
  aiActionsUsed: number;
  inboxesConnected: number;
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
