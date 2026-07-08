import {
  getSupabaseAdmin,
  isMissingUserSubscriptionsSchemaError,
  requireSupabaseAdmin,
} from "@/lib/supabase-admin";
import type { UserSubscriptionRow } from "@/lib/supabase/database.types";
import type { BillingInterval, PlanId, SubscriptionStatus } from "./types";
import { DEFAULT_PLAN_ID } from "./plans";
import { normalizeSubscriptionUserId } from "./user-id";

export type StoredSubscription = {
  userId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodEnd: string;
  razorpaySubscriptionId?: string | null;
  razorpayPlanId?: string | null;
  updatedAt: string;
};

export type SubscriptionUpsertMetadata = {
  razorpaySubscriptionId?: string;
  razorpayPlanId?: string;
  currentPeriodEnd?: string;
  status?: SubscriptionStatus;
};

const memoryStore = new Map<string, StoredSubscription>();

function getNextRenewalDate(billingInterval: BillingInterval = "monthly"): string {
  const date = new Date();
  if (billingInterval === "yearly") {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString();
}

function createDefaultStored(userId: string): StoredSubscription {
  return {
    userId,
    planId: DEFAULT_PLAN_ID,
    status: "active",
    billingInterval: "monthly",
    currentPeriodEnd: getNextRenewalDate(),
    razorpaySubscriptionId: null,
    razorpayPlanId: null,
    updatedAt: new Date().toISOString(),
  };
}

function mapRow(row: UserSubscriptionRow): StoredSubscription {
  return {
    userId: row.user_id,
    planId: row.plan_id as PlanId,
    status: row.status as SubscriptionStatus,
    billingInterval: row.billing_interval as BillingInterval,
    currentPeriodEnd: row.current_period_end,
    razorpaySubscriptionId: row.razorpay_subscription_id,
    razorpayPlanId: row.razorpay_plan_id,
    updatedAt: row.updated_at,
  };
}

function toRow(subscription: StoredSubscription): UserSubscriptionRow {
  return {
    user_id: subscription.userId,
    plan_id: subscription.planId,
    status: subscription.status,
    billing_interval: subscription.billingInterval,
    current_period_end: subscription.currentPeriodEnd,
    razorpay_subscription_id: subscription.razorpaySubscriptionId ?? null,
    razorpay_plan_id: subscription.razorpayPlanId ?? null,
    updated_at: subscription.updatedAt,
  };
}

function logUpsertFailure(
  operation: string,
  row: UserSubscriptionRow,
  error: { message: string; code?: string; details?: string; hint?: string }
): void {
  console.error(`[subscription/repository] ${operation} failed`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
    row,
  });
}

/**
 * Persists a subscription row via the Supabase service role client.
 * Used after successful Razorpay payment / webhook — never falls back to memory.
 */
export async function upsertUserSubscription(
  userId: string,
  planId: PlanId,
  billingInterval: BillingInterval = "monthly",
  metadata: SubscriptionUpsertMetadata = {}
): Promise<StoredSubscription> {
  const normalizedUserId = normalizeSubscriptionUserId(userId);
  const db = requireSupabaseAdmin();

  const row: UserSubscriptionRow = {
    user_id: normalizedUserId,
    plan_id: planId,
    status: metadata.status ?? "active",
    billing_interval: billingInterval,
    current_period_end:
      metadata.currentPeriodEnd ?? getNextRenewalDate(billingInterval),
    razorpay_subscription_id: metadata.razorpaySubscriptionId ?? null,
    razorpay_plan_id: metadata.razorpayPlanId ?? null,
    updated_at: new Date().toISOString(),
  };

  console.log("[subscription/repository] upsertUserSubscription start", row);

  const { data, error } = await db
    .from("user_subscriptions")
    .upsert(row, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    logUpsertFailure("upsertUserSubscription", row, error);

    if (isMissingUserSubscriptionsSchemaError(error.message)) {
      throw new Error(
        "user_subscriptions table is missing. Apply migrations 006_user_subscriptions.sql and 007_user_subscriptions_razorpay.sql in Supabase."
      );
    }

    throw new Error(`Failed to upsert user_subscriptions: ${error.message}`);
  }

  if (!data) {
    const message = "upsertUserSubscription returned no row after successful upsert";
    console.error(`[subscription/repository] ${message}`, { row });
    throw new Error(message);
  }

  const stored = mapRow(data as UserSubscriptionRow);
  memoryStore.set(normalizedUserId, stored);

  console.log("[subscription/repository] upsertUserSubscription success", {
    user_id: stored.userId,
    plan_id: stored.planId,
    status: stored.status,
    razorpay_subscription_id: stored.razorpaySubscriptionId,
    razorpay_plan_id: stored.razorpayPlanId,
    current_period_end: stored.currentPeriodEnd,
    updated_at: stored.updatedAt,
  });

  return stored;
}

export async function getStoredSubscription(
  userId: string
): Promise<StoredSubscription> {
  const normalizedUserId = normalizeSubscriptionUserId(userId);
  const db = getSupabaseAdmin();

  if (!db) {
    console.warn(
      "[subscription/repository] Supabase admin client unavailable on read — using memory/default"
    );
    return memoryStore.get(normalizedUserId) ?? createDefaultStored(normalizedUserId);
  }

  const { data, error } = await db
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", normalizedUserId)
    .maybeSingle();

  if (error) {
    if (isMissingUserSubscriptionsSchemaError(error.message)) {
      console.error(
        "[subscription/repository] user_subscriptions table missing on read — apply migrations 006 and 007"
      );
      return memoryStore.get(normalizedUserId) ?? createDefaultStored(normalizedUserId);
    }
    throw new Error(error.message);
  }

  if (!data) {
    return createDefaultStored(normalizedUserId);
  }

  const subscription = mapRow(data as UserSubscriptionRow);
  memoryStore.set(normalizedUserId, subscription);
  return subscription;
}

export async function persistSubscription(
  subscription: StoredSubscription
): Promise<StoredSubscription> {
  return upsertUserSubscription(
    subscription.userId,
    subscription.planId,
    subscription.billingInterval,
    {
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      razorpaySubscriptionId: subscription.razorpaySubscriptionId ?? undefined,
      razorpayPlanId: subscription.razorpayPlanId ?? undefined,
    }
  );
}

export async function setStoredPlan(
  userId: string,
  planId: PlanId,
  billingInterval: BillingInterval = "monthly",
  metadata: SubscriptionUpsertMetadata = {}
): Promise<StoredSubscription> {
  return upsertUserSubscription(userId, planId, billingInterval, metadata);
}
