import {
  getSupabaseAdmin,
  isMissingRazorpayColumnError,
  isMissingUserSubscriptionsSchemaError,
  isSupabaseNetworkError,
  requireSupabaseAdmin,
} from "@/lib/supabase-admin";
import {
  formatPostgrestError,
  logDbWriteResult,
  logDbWriteStart,
} from "@/lib/supabase/db-log";
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

const TABLE = "user_subscriptions";
const SCOPE = "subscription/repository";

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
  error: {
    message: string;
    code?: string;
    details?: string;
    hint?: string;
  },
  extra?: Record<string, unknown>
): void {
  console.error(`[subscription/repository] ${operation} failed`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
    row,
    ...extra,
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

type UpsertResult = {
  data: UserSubscriptionRow | null;
  error: {
    message: string;
    code?: string;
    details?: string;
    hint?: string;
  } | null;
};

async function executeUpsert(
  db: ReturnType<typeof requireSupabaseAdmin>,
  row: UserSubscriptionRow,
  includeRazorpayColumns: boolean
): Promise<UpsertResult> {
  const payload = buildUpsertPayload(row, includeRazorpayColumns);

  logDbWriteStart(SCOPE, "upsert", TABLE, {
    onConflict: "user_id",
    includeRazorpayColumns,
    payload,
  });

  const { data, error, status, statusText } = await db
    .from(TABLE)
    .upsert(payload, { onConflict: "user_id" })
    .select("*");

  logDbWriteResult(SCOPE, "upsert", TABLE, {
    httpStatus: status,
    statusText,
    error,
    rows: Array.isArray(data) ? data.length : data ? 1 : 0,
    data,
  });

  if (error) {
    return { data: null, error };
  }

  const saved = Array.isArray(data)
    ? (data[0] as UserSubscriptionRow)
    : (data as UserSubscriptionRow | null);
  if (saved) {
    return { data: saved, error: null };
  }

  const { data: readBack, error: readError, status: readStatus, statusText: readStatusText } =
    await db
      .from(TABLE)
      .select("*")
      .eq("user_id", row.user_id)
      .maybeSingle();

  logDbWriteResult(SCOPE, "upsert-read-back", TABLE, {
    httpStatus: readStatus,
    statusText: readStatusText,
    error: readError,
    rows: readBack ? 1 : 0,
    data: readBack,
  });

  if (readError) {
    return { data: null, error: readError };
  }

  return { data: readBack as UserSubscriptionRow | null, error: null };
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

  const { data: existingRow, error: existingError } = await db
    .from("user_subscriptions")
    .select("razorpay_subscription_id, razorpay_plan_id, current_period_end")
    .eq("user_id", normalizedUserId)
    .maybeSingle();

  if (existingError) {
    console.error("[subscription/repository] existing row lookup failed", {
      user_id: normalizedUserId,
      error: existingError,
    });
  }

  const row: UserSubscriptionRow = {
    user_id: normalizedUserId,
    plan_id: planId,
    status: metadata.status ?? "active",
    billing_interval: billingInterval,
    current_period_end:
      metadata.currentPeriodEnd ??
      existingRow?.current_period_end ??
      getNextRenewalDate(billingInterval),
    razorpay_subscription_id:
      metadata.razorpaySubscriptionId ??
      existingRow?.razorpay_subscription_id ??
      null,
    razorpay_plan_id:
      metadata.razorpayPlanId ?? existingRow?.razorpay_plan_id ?? null,
    updated_at: new Date().toISOString(),
  };

  console.log("[subscription/repository] upsertUserSubscription start", {
    user_id: row.user_id,
    plan_id: row.plan_id,
    status: row.status,
    billing_interval: row.billing_interval,
    razorpay_subscription_id: row.razorpay_subscription_id,
    razorpay_plan_id: row.razorpay_plan_id,
    current_period_end: row.current_period_end,
  });

  let result = await executeUpsert(db, row, true);

  if (
    result.error &&
    isMissingRazorpayColumnError(result.error.message) &&
    (row.razorpay_subscription_id || row.razorpay_plan_id)
  ) {
    console.warn(
      "[subscription/repository] retrying upsert without Razorpay columns",
      { user_id: row.user_id }
    );
    result = await executeUpsert(db, row, false);
  }

  if (result.error) {
    logUpsertFailure("upsertUserSubscription", row, result.error, {
      line: "lib/subscription/repository.ts:executeUpsert",
    });

    if (isMissingUserSubscriptionsSchemaError(result.error.message)) {
      throw new Error(
        `user_subscriptions table schema error: ${result.error.message}`
      );
    }

    if (isSupabaseNetworkError(result.error.message)) {
      throw new Error(
        `Supabase network error during upsert: ${result.error.message}`
      );
    }

    throw new Error(
      `Failed to upsert user_subscriptions: ${formatPostgrestError(result.error)}`
    );
  }

  if (!result.data) {
    const message = "upsertUserSubscription returned no row after upsert and read-back";
    console.error(`[subscription/repository] ${message}`, { row });
    throw new Error(message);
  }

  const stored = mapRow(result.data);

  const { data: verifyRow, error: verifyError } = await db
    .from(TABLE)
    .select("*")
    .eq("user_id", normalizedUserId)
    .maybeSingle();

  logDbWriteResult(SCOPE, "upsert-verify", TABLE, {
    error: verifyError,
    rows: verifyRow ? 1 : 0,
    data: verifyRow,
  });

  if (verifyError || !verifyRow) {
    throw new Error(
      `user_subscriptions upsert verify failed for ${normalizedUserId}: ${formatPostgrestError(verifyError ?? { message: "row not found after upsert" })}`
    );
  }

  if ((verifyRow as UserSubscriptionRow).plan_id !== planId) {
    throw new Error(
      `user_subscriptions verify plan mismatch: expected ${planId}, got ${(verifyRow as UserSubscriptionRow).plan_id}`
    );
  }

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
    const message =
      "[subscription/repository] Supabase service role client unavailable — cannot read subscription";
    console.error(message);
    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    }
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
      return memoryStore.get(normalizedUserId) ?? createDefaultStored(normalizedUserId);
    }

    if (isSupabaseNetworkError(error.message)) {
      const cached = memoryStore.get(normalizedUserId);
      if (cached) return cached;
      throw new Error(`Supabase network error on read: ${error.message}`);
    }

    throw new Error(error.message);
  }

  if (!data) {
    console.log("[subscription/repository] no row for user — defaulting to free", {
      user_id: normalizedUserId,
    });
    return createDefaultStored(normalizedUserId);
  }

  const subscription = mapRow(data as UserSubscriptionRow);
  memoryStore.set(normalizedUserId, subscription);

  console.log("[subscription/repository] getStoredSubscription hit", {
    user_id: subscription.userId,
    plan_id: subscription.planId,
    razorpay_subscription_id: subscription.razorpaySubscriptionId,
  });

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
