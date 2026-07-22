import type {
  BillingInterval,
  PlanId,
  SubscriptionSnapshot,
  UserSubscription,
} from "./types";
import { DEFAULT_PLAN_ID, getPlanDisplayName, getPlanLimits } from "./plans";
import { getUserUsage, recordAiAction as persistAiAction } from "@/lib/dashboard/user-usage";
import { computeCreditBalance } from "@/lib/ai-credits/balance";
import { resolveCreditCycle } from "@/lib/ai-credits/consume";
import { gmailAccountRepository } from "@/lib/gmail/repository";
import { logApiError } from "@/lib/api/log-error";
import {
  getRemainingTrialDays,
  getRemainingTrialHours,
  getTrialProgressPercent,
  hasProductAccess,
  isTrialActive,
} from "@/lib/trial/helpers";
import {
  getStoredSubscription,
  setStoredPlan,
  type StoredSubscription,
  type SubscriptionUpsertMetadata,
} from "./repository";

export type { SubscriptionUpsertMetadata } from "./repository";

export interface SubscriptionProvider {
  getSubscription(userId: string): Promise<UserSubscription>;
  setPlan(
    userId: string,
    planId: PlanId,
    billingInterval?: BillingInterval,
    metadata?: SubscriptionUpsertMetadata
  ): Promise<UserSubscription>;
  recordAiAction(userId: string): Promise<UserSubscription>;
  recordInboxConnection(userId: string): Promise<UserSubscription>;
}

function toUserSubscription(
  stored: StoredSubscription,
  usage: UserSubscription["usage"]
): UserSubscription {
  return {
    userId: stored.userId,
    planId: stored.planId,
    status: stored.status,
    billingInterval: stored.billingInterval,
    currentPeriodEnd: stored.currentPeriodEnd,
    usage,
    updatedAt: stored.updatedAt,
    isTrial: stored.isTrial,
    trialStartedAt: stored.trialStartedAt,
    trialEndsAt: stored.trialEndsAt,
    trialExpired: stored.trialExpired,
  };
}

export function createDefaultSubscription(userId: string): UserSubscription {
  return {
    userId,
    planId: DEFAULT_PLAN_ID,
    status: "active",
    billingInterval: "monthly",
    currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    usage: {
      aiActionsUsed: 0,
      inboxesConnected: 0,
      aiCreditsRemaining: 100,
      aiCreditsAllotment: 100,
      aiCreditWarning: "none",
    },
    updatedAt: new Date().toISOString(),
    isTrial: false,
    trialStartedAt: null,
    trialEndsAt: null,
    trialExpired: false,
  };
}

export function toSubscriptionSnapshot(
  subscription: UserSubscription
): SubscriptionSnapshot {
  const limits = getPlanLimits(subscription.planId);
  const trialFields = {
    isTrial: subscription.isTrial,
    trialStartedAt: subscription.trialStartedAt,
    trialEndsAt: subscription.trialEndsAt,
    trialExpired: subscription.trialExpired,
  };

  return {
    ...subscription,
    limits,
    planName: getPlanDisplayName(subscription.planId),
    trialActive: isTrialActive(trialFields),
    remainingTrialDays: getRemainingTrialDays(trialFields),
    remainingTrialHours: getRemainingTrialHours(trialFields),
    trialProgressPercent: getTrialProgressPercent(trialFields),
    hasProductAccess: hasProductAccess({
      planId: subscription.planId,
      status: subscription.status,
      trial: trialFields,
    }),
  };
}

async function loadUsageSafely(userId: string): Promise<UserSubscription["usage"]> {
  try {
    const cycle = await resolveCreditCycle(userId);
    const usage = await getUserUsage(userId, {
      cycleKey: cycle.cycleKey,
      periodStart: cycle.periodStart,
      periodEnd: cycle.periodEnd,
      allotment: cycle.allotment,
    });
    const allotment =
      usage.aiCreditsAllotment ||
      cycle.allotment ||
      getPlanLimits(cycle.planId).aiActionsPerMonth;
    const balance = computeCreditBalance(usage.aiActionsUsed, allotment);
    return {
      aiActionsUsed: usage.aiActionsUsed,
      inboxesConnected: 0,
      aiCreditsRemaining: balance.remaining,
      aiCreditsAllotment: balance.allotment,
      aiCreditWarning: balance.warning,
    };
  } catch (error) {
    logApiError("subscription/provider", error, {
      operation: "getUserUsage",
      userId,
    });
    return {
      aiActionsUsed: 0,
      inboxesConnected: 0,
      aiCreditsRemaining: 100,
      aiCreditsAllotment: 100,
      aiCreditWarning: "none",
    };
  }
}

async function loadInboxCountSafely(userId: string): Promise<number> {
  try {
    const accounts = await gmailAccountRepository.listAccounts(userId);
    return accounts.length;
  } catch (error) {
    logApiError("subscription/provider", error, {
      operation: "listGmailAccounts",
      userId,
    });
    return 0;
  }
}

class SupabaseSubscriptionProvider implements SubscriptionProvider {
  async getSubscription(userId: string): Promise<UserSubscription> {
    const stored = await getStoredSubscription(userId);

    const [usageBase, inboxesConnected] = await Promise.all([
      loadUsageSafely(userId),
      loadInboxCountSafely(userId),
    ]);

    return toUserSubscription(stored, {
      ...usageBase,
      inboxesConnected,
    });
  }

  async setPlan(
    userId: string,
    planId: PlanId,
    billingInterval: BillingInterval = "monthly",
    metadata?: SubscriptionUpsertMetadata
  ): Promise<UserSubscription> {
    const stored = await setStoredPlan(userId, planId, billingInterval, metadata);
    const [usageBase, inboxesConnected] = await Promise.all([
      loadUsageSafely(userId),
      loadInboxCountSafely(userId),
    ]);

    return toUserSubscription(stored, {
      ...usageBase,
      inboxesConnected,
    });
  }

  async recordAiAction(userId: string): Promise<UserSubscription> {
    await persistAiAction(userId);
    return this.getSubscription(userId);
  }

  async recordInboxConnection(userId: string): Promise<UserSubscription> {
    return this.getSubscription(userId);
  }
}

export const subscriptionProvider: SubscriptionProvider =
  new SupabaseSubscriptionProvider();
