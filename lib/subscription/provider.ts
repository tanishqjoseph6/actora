import type {
  BillingInterval,
  PlanId,
  SubscriptionSnapshot,
  UserSubscription,
} from "./types";
import { DEFAULT_PLAN_ID, getPlanDisplayName, getPlanLimits } from "./plans";

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

function getNextRenewalDate(billingInterval: BillingInterval = "monthly"): string {
  const date = new Date();
  if (billingInterval === "yearly") {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString();
}

export function createDefaultSubscription(userId: string): UserSubscription {
  return {
    userId,
    planId: DEFAULT_PLAN_ID,
    status: "active",
    billingInterval: "monthly",
    currentPeriodEnd: getNextRenewalDate(),
    usage: {
      aiActionsUsed: 0,
      inboxesConnected: 1,
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

/**
 * In-memory mock provider for development.
 * Replace with Razorpay-backed provider via webhook + database.
 */
class MockSubscriptionProvider implements SubscriptionProvider {
  private store = new Map<string, UserSubscription>();

  async getSubscription(userId: string): Promise<UserSubscription> {
    const existing = this.store.get(userId);
    if (existing) return existing;

    const subscription = createDefaultSubscription(userId);
    this.store.set(userId, subscription);
    return subscription;
  }

  async setPlan(
    userId: string,
    planId: PlanId,
    billingInterval: BillingInterval = "monthly"
  ): Promise<UserSubscription> {
    const current = await this.getSubscription(userId);
    const updated: UserSubscription = {
      ...current,
      planId,
      billingInterval,
      status: "active",
      currentPeriodEnd: getNextRenewalDate(billingInterval),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(userId, updated);
    return updated;
  }

  async recordAiAction(userId: string): Promise<UserSubscription> {
    const current = await this.getSubscription(userId);
    const updated: UserSubscription = {
      ...current,
      usage: {
        ...current.usage,
        aiActionsUsed: current.usage.aiActionsUsed + 1,
      },
      updatedAt: new Date().toISOString(),
    };
    this.store.set(userId, updated);
    return updated;
  }

  async recordInboxConnection(userId: string): Promise<UserSubscription> {
    const current = await this.getSubscription(userId);
    const updated: UserSubscription = {
      ...current,
      usage: {
        ...current.usage,
        inboxesConnected: current.usage.inboxesConnected + 1,
      },
      updatedAt: new Date().toISOString(),
    };
    this.store.set(userId, updated);
    return updated;
  }
}

// TODO: Swap to RazorpaySubscriptionProvider when webhooks are live.
export const subscriptionProvider: SubscriptionProvider =
  new MockSubscriptionProvider();

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
