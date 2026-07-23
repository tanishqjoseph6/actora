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
  /** Total credits remaining (monthly + purchased). Infinity when unlimited. */
  aiCreditsRemaining?: number;
  /** Monthly allotment for the current cycle. */
  aiCreditsAllotment?: number;
  /** Monthly credits still available this cycle. */
  monthlyCreditsRemaining?: number;
  /** Purchased top-up credits remaining. */
  purchasedCreditsRemaining?: number;
  /** Warning band derived from total remaining %. */
  aiCreditWarning?: "none" | "low_20" | "critical_10" | "exhausted";
  /** ISO date when monthly credits reset. */
  periodEnd?: string | null;
  /** Stable billing-cycle key for client-side dedupe. */
  cycleKey?: string | null;
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
