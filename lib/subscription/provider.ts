import type {
  BillingInterval,
  PlanId,
  SubscriptionSnapshot,
  UserSubscription,
} from "./types";
import { DEFAULT_PLAN_ID, getPlanDisplayName, getPlanLimits } from "./plans";
import { getUserUsage, recordAiAction as persistAiAction } from "@/lib/dashboard/user-usage";
import { gmailAccountRepository } from "@/lib/gmail/repository";
import {
  getStoredSubscription,
  setStoredPlan,
  type StoredSubscription,
} from "./repository";

export interface SubscriptionProvider {
  getSubscription(userId: string): Promise<UserSubscription>;
  setPlan(
    userId: string,
    planId: PlanId,
    billingInterval?: BillingInterval
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

class SupabaseSubscriptionProvider implements SubscriptionProvider {
  async getSubscription(userId: string): Promise<UserSubscription> {
    const [stored, usage, accounts] = await Promise.all([
      getStoredSubscription(userId),
      getUserUsage(userId),
      gmailAccountRepository.listAccounts(userId),
    ]);

    return toUserSubscription(stored, {
      aiActionsUsed: usage.aiActionsUsed,
      inboxesConnected: accounts.length,
    });
  }

  async setPlan(
    userId: string,
    planId: PlanId,
    billingInterval: BillingInterval = "monthly"
  ): Promise<UserSubscription> {
    const stored = await setStoredPlan(userId, planId, billingInterval);
    const [usage, accounts] = await Promise.all([
      getUserUsage(userId),
      gmailAccountRepository.listAccounts(userId),
    ]);

    return toUserSubscription(stored, {
      aiActionsUsed: usage.aiActionsUsed,
      inboxesConnected: accounts.length,
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

/**
 * Called by Razorpay webhook handler to sync subscription state.
 */
export async function syncSubscriptionFromWebhook(
  payload: {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          notes?: {
            userId?: string;
            planId?: PlanId;
            period?: BillingInterval;
          };
        };
      };
    };
  }
): Promise<void> {
  const event = payload.event;

  if (event === "payment.captured" || event === "order.paid") {
    const notes = payload.payload?.payment?.entity?.notes;

    if (notes?.userId && notes?.planId) {
      await subscriptionProvider.setPlan(
        notes.userId,
        notes.planId,
        notes.period ?? "monthly"
      );
    }
  }
}
