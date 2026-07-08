import {
  getSupabaseAdmin,
  isMissingRazorpayColumnError,
  isMissingUserSubscriptionsSchemaError,
  isSupabaseNetworkError,
  requireSupabaseAdmin,
} from "@/lib/supabase-admin";
import { logApiError } from "@/lib/api/log-error";
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
    usesServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    supabaseUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
  });
}

function buildUpsertPayload(
  row: UserSubscriptionRow,
  includeRazorpayColumns: boolean
): Record<string, string | null> {
  const base = {
    user_id: row.user_id,
    plan_id: row.plan_id,
    status: row.status,
    billing_interval: row.billing_interval,
    current_period_end: row.current_period_end,
    updated_at: row.updated_at,
  };

  if (!includeRazorpayColumns) {
    return base;
  }

  return {
    ...base,
    razorpay_subscription_id: row.razorpay_subscription_id,
    razorpay_plan_id: row.razorpay_plan_id,
  };
}

async function executeUpsert(
  db: ReturnType<typeof requireSupabaseAdmin>,
  row: UserSubscriptionRow,
  includeRazorpayColumns: boolean
) {
  return db
    .from("user_subscriptions")
    .upsert(buildUpsertPayload(row, includeRazorpayColumns), {
      onConflict: "user_id",
    })
    .select("*")
    .single();
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

  console.log("[subscription/repository] upsertUserSubscription start", {
    user_id: row.user_id,
    plan_id: row.plan_id,
    status: row.status,
    billing_interval: row.billing_interval,
    razorpay_subscription_id: row.razorpay_subscription_id,
    razorpay_plan_id: row.razorpay_plan_id,
  });

  let { data, error } = await executeUpsert(db, row, true);

  if (
    error &&
    isMissingRazorpayColumnError(error.message) &&
    (row.razorpay_subscription_id || row.razorpay_plan_id)
  ) {
    console.warn(
      "[subscription/repository] Razorpay columns missing — retrying upsert without them. Apply migrations 007 and 008 in Supabase."
    );
    ({ data, error } = await executeUpsert(db, row, false));
  }

  if (error) {
    logUpsertFailure("upsertUserSubscription", row, error);

    if (isMissingUserSubscriptionsSchemaError(error.message)) {
      throw new Error(
        "user_subscriptions table is missing. Apply migrations 006_user_subscriptions.sql, 007_user_subscriptions_razorpay.sql, and 008_user_subscriptions_rls.sql in Supabase."
      );
    }

    if (isSupabaseNetworkError(error.message)) {
      throw new Error(
        "Could not reach Supabase to save subscription. Check NEXT_PUBLIC_SUPABASE_URL and network access from Vercel."
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
    console.error(
      "[subscription/repository] Supabase service role client unavailable — cannot read subscription from database"
    );
    return memoryStore.get(normalizedUserId) ?? createDefaultStored(normalizedUserId);
  }

  const { data, error } = await db
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", normalizedUserId)
    .maybeSingle();

  if (error) {
    logApiError("subscription/repository", error, {
      operation: "getStoredSubscription",
      userId: normalizedUserId,
    });

    if (isMissingUserSubscriptionsSchemaError(error.message)) {
      console.error(
        "[subscription/repository] user_subscriptions table missing on read — apply migrations 006–008"
      );
      return memoryStore.get(normalizedUserId) ?? createDefaultStored(normalizedUserId);
    }

    if (isSupabaseNetworkError(error.message)) {
      const cached = memoryStore.get(normalizedUserId);
      if (cached) {
        console.warn(
          "[subscription/repository] Supabase unreachable — serving cached subscription for",
          normalizedUserId
        );
        return cached;
      }
      throw new Error(
        "Could not reach Supabase to load subscription. Check NEXT_PUBLIC_SUPABASE_URL."
      );
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
