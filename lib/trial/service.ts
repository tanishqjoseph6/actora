import { buildTrialSnapshot, type TrialSnapshot } from "@/lib/trial/helpers";
import {
  getStoredSubscription,
  startTrialSubscription,
} from "@/lib/subscription/repository";
import { toSubscriptionSnapshot } from "@/lib/subscription/provider";
import { subscriptionProvider } from "@/lib/subscription/provider";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import { sendTrialEmail } from "@/lib/trial/email";

export async function getTrialStatus(userId: string): Promise<{
  trial: TrialSnapshot;
  subscription: ReturnType<typeof toSubscriptionSnapshot>;
}> {
  const normalized = normalizeSubscriptionUserId(userId);
  const subscription = await subscriptionProvider.getSubscription(normalized);
  const trial = buildTrialSnapshot(
    subscription.planId,
    subscription.status,
    {
      isTrial: subscription.isTrial,
      trialStartedAt: subscription.trialStartedAt,
      trialEndsAt: subscription.trialEndsAt,
      trialExpired: subscription.trialExpired,
    }
  );

  return {
    trial,
    subscription: toSubscriptionSnapshot(subscription),
  };
}

/**
 * Start trial for a user. Idempotent — one trial per account lifetime.
 * Sends Day 0 welcome email when a new trial is created.
 */
export async function ensureTrialStarted(userId: string): Promise<{
  ok: boolean;
  created: boolean;
  reason?: string;
  trial: TrialSnapshot;
  subscription: ReturnType<typeof toSubscriptionSnapshot>;
}> {
  const normalized = normalizeSubscriptionUserId(userId);
  const result = await startTrialSubscription(normalized);
  const subscription = await subscriptionProvider.getSubscription(normalized);
  const trial = buildTrialSnapshot(
    subscription.planId,
    subscription.status,
    {
      isTrial: subscription.isTrial,
      trialStartedAt: subscription.trialStartedAt,
      trialEndsAt: subscription.trialEndsAt,
      trialExpired: subscription.trialExpired,
    }
  );

  if (result.created) {
    await sendTrialEmail(normalized, "day_0").catch((error) => {
      console.error("[trial] day_0 email failed", error);
    });
  }

  return {
    ok: result.created || result.reason === "already_paid" || trial.trialActive,
    created: result.created,
    reason: result.reason,
    trial,
    subscription: toSubscriptionSnapshot(subscription),
  };
}

/**
 * Provision trial on first authenticated session if the user has no
 * subscription row and has never used a trial.
 */
export async function provisionTrialOnSignIn(userId: string): Promise<void> {
  const normalized = normalizeSubscriptionUserId(userId);
  const stored = await getStoredSubscription(normalized);

  if (stored.isTrial || stored.trialExpired || stored.trialStartedAt) {
    return;
  }

  if (stored.planId !== "free" && stored.planId !== "trial") {
    return;
  }

  // Virtual default (no DB row) has plan free and no trialStartedAt.
  // Real free row without trial fields also qualifies.
  const { created } = await startTrialSubscription(normalized);
  if (created) {
    await sendTrialEmail(normalized, "day_0").catch((error) => {
      console.error("[trial] day_0 email failed", error);
    });
  }
}
