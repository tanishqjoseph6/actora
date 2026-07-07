import {
  getSupabaseAdmin,
  isMissingUserSubscriptionsSchemaError,
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
  const normalizedUserId = normalizeSubscriptionUserId(userId);
  const db = getSupabaseAdmin();

  if (!db) {
    console.warn("[subscription/repository] Supabase admin client unavailable — using memory store");
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
        "[subscription/repository] user_subscriptions table missing — apply migration 006_user_subscriptions.sql"
      );
      return memoryStore.get(normalizedUserId) ?? createDefaultStored(normalizedUserId);
    }
    throw new Error(error.message);
  }

  if (!data) {
    const created = createDefaultStored(normalizedUserId);
    const { error: insertError } = await db
      .from("user_subscriptions")
      .insert(toRow(created));

    if (insertError && !isMissingUserSubscriptionsSchemaError(insertError.message)) {
      console.error("[subscription/repository] insert default subscription failed", insertError.message);
      throw new Error(insertError.message);
    }

    if (!insertError) {
      memoryStore.set(normalizedUserId, created);
    }

    return created;
  }

  const subscription = mapRow(data as UserSubscriptionRow);
  memoryStore.set(normalizedUserId, subscription);
  return subscription;
}

export async function persistSubscription(
  subscription: StoredSubscription
): Promise<StoredSubscription> {
  const normalizedUserId = normalizeSubscriptionUserId(subscription.userId);
  const next = {
    ...subscription,
    userId: normalizedUserId,
    updatedAt: new Date().toISOString(),
  };
  const db = getSupabaseAdmin();

  if (!db) {
    console.warn("[subscription/repository] Supabase admin client unavailable — persisting to memory only");
    memoryStore.set(normalizedUserId, next);
    return next;
  }

  const { data, error } = await db
    .from("user_subscriptions")
    .upsert(toRow(next), { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    if (isMissingUserSubscriptionsSchemaError(error.message)) {
      console.error(
        "[subscription/repository] user_subscriptions table missing on upsert — plan not persisted to database"
      );
      memoryStore.set(normalizedUserId, next);
      return next;
    }
    console.error("[subscription/repository] upsert failed", {
      userId: normalizedUserId,
      planId: next.planId,
      error: error.message,
    });
    throw new Error(error.message);
  }

  const stored = mapRow(data as UserSubscriptionRow);
  memoryStore.set(normalizedUserId, stored);

  console.log("[subscription/repository] upsert success", {
    userId: stored.userId,
    planId: stored.planId,
    billingInterval: stored.billingInterval,
  });

  return stored;
}

export async function setStoredPlan(
  userId: string,
  planId: PlanId,
  billingInterval: BillingInterval = "monthly"
): Promise<StoredSubscription> {
  const normalizedUserId = normalizeSubscriptionUserId(userId);
  const current = await getStoredSubscription(normalizedUserId);
  return persistSubscription({
    ...current,
    userId: normalizedUserId,
    planId,
    billingInterval,
    status: "active",
    currentPeriodEnd: getNextRenewalDate(billingInterval),
  });
}
