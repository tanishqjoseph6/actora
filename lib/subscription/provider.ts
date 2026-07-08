import type {
  BillingInterval,
  PlanId,
  SubscriptionSnapshot,
  UserSubscription,
} from "./types";
import { DEFAULT_PLAN_ID, getPlanDisplayName, getPlanLimits } from "./plans";
import { getUserUsage, recordAiAction as persistAiAction } from "@/lib/dashboard/user-usage";
import { gmailAccountRepository } from "@/lib/gmail/repository";
import { logApiError } from "@/lib/api/log-error";
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
    },
    updatedAt: new Date().toISOString(),
  };
}

export function toSubscriptionSnapshot(
  subscription: UserSubscription
): SubscriptionSnapshot {
  const limits = getPlanLimits(subscription.planId);

  return {
    ...subscription,
    limits,
    planName: getPlanDisplayName(subscription.planId),
  };
}

async function loadUsageSafely(userId: string): Promise<UserSubscription["usage"]> {
  try {
    const usage = await getUserUsage(userId);
    return {
      aiActionsUsed: usage.aiActionsUsed,
      inboxesConnected: 0,
    };
  } catch (error) {
    logApiError("subscription/provider", error, {
      operation: "getUserUsage",
      userId,
    });
    return { aiActionsUsed: 0, inboxesConnected: 0 };
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
  /**
   * Reads plan state directly from Supabase (service role).
   * Usage/inbox counts are best-effort and never fail the subscription read.
   */
  async getSubscription(userId: string): Promise<UserSubscription> {
    const stored = await getStoredSubscription(userId);

    const [usageBase, inboxesConnected] = await Promise.all([
      loadUsageSafely(userId),
      loadInboxCountSafely(userId),
    ]);

    return toUserSubscription(stored, {
      aiActionsUsed: usageBase.aiActionsUsed,
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
      aiActionsUsed: usageBase.aiActionsUsed,
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
