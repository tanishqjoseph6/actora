import {
  getSupabaseAdmin,
  isMissingUserSubscriptionsSchemaError,
} from "@/lib/supabase-admin";
import type { UserSubscriptionRow } from "@/lib/supabase/database.types";
import type { BillingInterval, PlanId, SubscriptionStatus } from "./types";
import { DEFAULT_PLAN_ID } from "./plans";

export type StoredSubscription = {
  userId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodEnd: string;
  updatedAt: string;
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
    updated_at: subscription.updatedAt,
  };
}

export async function getStoredSubscription(
  userId: string
): Promise<StoredSubscription> {
  const db = getSupabaseAdmin();

  if (!db) {
    return memoryStore.get(userId) ?? createDefaultStored(userId);
  }

  const { data, error } = await db
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingUserSubscriptionsSchemaError(error.message)) {
      return memoryStore.get(userId) ?? createDefaultStored(userId);
    }
    throw new Error(error.message);
  }

  if (!data) {
    const created = createDefaultStored(userId);
    const { error: insertError } = await db
      .from("user_subscriptions")
      .insert(toRow(created));

    if (insertError && !isMissingUserSubscriptionsSchemaError(insertError.message)) {
      throw new Error(insertError.message);
    }

    if (!insertError) {
      memoryStore.set(userId, created);
    }

    return created;
  }

  const subscription = mapRow(data as UserSubscriptionRow);
  memoryStore.set(userId, subscription);
  return subscription;
}

export async function persistSubscription(
  subscription: StoredSubscription
): Promise<StoredSubscription> {
  const db = getSupabaseAdmin();
  const next = { ...subscription, updatedAt: new Date().toISOString() };

  if (!db) {
    memoryStore.set(subscription.userId, next);
    return next;
  }

  const { data, error } = await db
    .from("user_subscriptions")
    .upsert(toRow(next))
    .select("*")
    .single();

  if (error) {
    if (isMissingUserSubscriptionsSchemaError(error.message)) {
      memoryStore.set(subscription.userId, next);
      return next;
    }
    throw new Error(error.message);
  }

  const stored = mapRow(data as UserSubscriptionRow);
  memoryStore.set(subscription.userId, stored);
  return stored;
}

export async function setStoredPlan(
  userId: string,
  planId: PlanId,
  billingInterval: BillingInterval = "monthly"
): Promise<StoredSubscription> {
  const current = await getStoredSubscription(userId);
  return persistSubscription({
    ...current,
    planId,
    billingInterval,
    status: "active",
    currentPeriodEnd: getNextRenewalDate(billingInterval),
  });
}
