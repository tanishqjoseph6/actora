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
import {
  computeTrialEndsAt,
  emptyTrialFields,
  hasTrialExpired,
  isPaidPlanId,
  type TrialFields,
} from "@/lib/trial/helpers";

export type StoredSubscription = {
  userId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodEnd: string;
  razorpaySubscriptionId?: string | null;
  razorpayPlanId?: string | null;
  updatedAt: string;
  isTrial: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialExpired: boolean;
};

export type SubscriptionUpsertMetadata = {
  razorpaySubscriptionId?: string;
  razorpayPlanId?: string;
  currentPeriodEnd?: string;
  status?: SubscriptionStatus;
  /** When upgrading to a paid plan, clears trial flags. */
  clearTrial?: boolean;
  isTrial?: boolean;
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  trialExpired?: boolean;
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
    ...emptyTrialFields(),
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
    isTrial: Boolean(row.is_trial),
    trialStartedAt: row.trial_started_at ?? null,
    trialEndsAt: row.trial_ends_at ?? null,
    trialExpired: Boolean(row.trial_expired),
  };
}

function trialFieldsFromStored(stored: StoredSubscription): TrialFields {
  return {
    isTrial: stored.isTrial,
    trialStartedAt: stored.trialStartedAt,
    trialEndsAt: stored.trialEndsAt,
    trialExpired: stored.trialExpired,
  };
}

function logUpsertFailure(
  operation: string,
  row: Record<string, unknown>,
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
): Record<string, string | boolean | null> {
  const base: Record<string, string | boolean | null> = {
    user_id: row.user_id,
    plan_id: row.plan_id,
    status: row.status,
    billing_interval: row.billing_interval,
    current_period_end: row.current_period_end,
    is_trial: row.is_trial,
    trial_started_at: row.trial_started_at,
    trial_ends_at: row.trial_ends_at,
    trial_expired: row.trial_expired,
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

  const {
    data: readBack,
    error: readError,
    status: readStatus,
    statusText: readStatusText,
  } = await db.from(TABLE).select("*").eq("user_id", row.user_id).maybeSingle();

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
    .from(TABLE)
    .select("*")
    .eq("user_id", normalizedUserId)
    .maybeSingle();

  if (existingError) {
    console.error("[subscription/repository] existing row lookup failed", {
      user_id: normalizedUserId,
      error: existingError,
    });
  }

  const existing = existingRow as UserSubscriptionRow | null;
  const convertingToPaid = isPaidPlanId(planId) || metadata.clearTrial === true;

  const row: UserSubscriptionRow = {
    user_id: normalizedUserId,
    plan_id: planId,
    status: metadata.status ?? "active",
    billing_interval: billingInterval,
    current_period_end:
      metadata.currentPeriodEnd ??
      existing?.current_period_end ??
      getNextRenewalDate(billingInterval),
    razorpay_subscription_id:
      metadata.razorpaySubscriptionId ??
      existing?.razorpay_subscription_id ??
      null,
    razorpay_plan_id:
      metadata.razorpayPlanId ?? existing?.razorpay_plan_id ?? null,
    updated_at: new Date().toISOString(),
    is_trial: convertingToPaid
      ? false
      : (metadata.isTrial ?? existing?.is_trial ?? false),
    trial_started_at: convertingToPaid
      ? existing?.trial_started_at ?? null
      : (metadata.trialStartedAt ?? existing?.trial_started_at ?? null),
    trial_ends_at: convertingToPaid
      ? existing?.trial_ends_at ?? null
      : (metadata.trialEndsAt ?? existing?.trial_ends_at ?? null),
    trial_expired: convertingToPaid
      ? true
      : (metadata.trialExpired ?? existing?.trial_expired ?? false),
  };

  console.log("[subscription/repository] upsertUserSubscription start", {
    user_id: row.user_id,
    plan_id: row.plan_id,
    status: row.status,
    is_trial: row.is_trial,
    trial_expired: row.trial_expired,
    convertingToPaid,
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
    logUpsertFailure("upsertUserSubscription", row, result.error);

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
    throw new Error(
      "upsertUserSubscription returned no row after upsert and read-back"
    );
  }

  const stored = mapRow(result.data);
  memoryStore.set(normalizedUserId, stored);

  console.log("[subscription/repository] upsertUserSubscription success", {
    user_id: stored.userId,
    plan_id: stored.planId,
    is_trial: stored.isTrial,
    trial_ends_at: stored.trialEndsAt,
  });

  return stored;
}

/**
 * Lazily expire a trial that has passed trial_ends_at.
 * Idempotent — safe to call on every subscription read.
 */
export async function expireTrialIfNeeded(
  stored: StoredSubscription
): Promise<StoredSubscription> {
  if (!hasTrialExpired(trialFieldsFromStored(stored))) {
    return stored;
  }

  if (stored.trialExpired && stored.planId === "free") {
    return stored;
  }

  if (isPaidPlanId(stored.planId) && !stored.isTrial) {
    return stored;
  }

  console.log("[subscription/repository] expiring trial", {
    user_id: stored.userId,
    trial_ends_at: stored.trialEndsAt,
  });

  return upsertUserSubscription(stored.userId, "free", "monthly", {
    status: "active",
    isTrial: false,
    trialStartedAt: stored.trialStartedAt,
    trialEndsAt: stored.trialEndsAt,
    trialExpired: true,
    currentPeriodEnd: stored.currentPeriodEnd,
    razorpaySubscriptionId: stored.razorpaySubscriptionId ?? undefined,
    razorpayPlanId: stored.razorpayPlanId ?? undefined,
  });
}

/**
 * Start a one-time 14-day trial. Rejects if the user already had a trial
 * or already has a paid plan.
 */
export async function startTrialSubscription(
  userId: string
): Promise<{ stored: StoredSubscription; created: boolean; reason?: string }> {
  const normalizedUserId = normalizeSubscriptionUserId(userId);
  const existing = await getStoredSubscription(normalizedUserId);

  if (isPaidPlanId(existing.planId) && existing.status === "active") {
    return {
      stored: existing,
      created: false,
      reason: "already_paid",
    };
  }

  if (existing.isTrial || existing.trialExpired || existing.trialStartedAt) {
    const refreshed = await expireTrialIfNeeded(existing);
    return {
      stored: refreshed,
      created: false,
      reason: "trial_already_used",
    };
  }

  // Row may be a virtual default (no DB row) — still safe to upsert trial once.
  const startedAt = new Date();
  const endsAt = computeTrialEndsAt(startedAt);

  const stored = await upsertUserSubscription(normalizedUserId, "trial", "monthly", {
    status: "active",
    isTrial: true,
    trialStartedAt: startedAt.toISOString(),
    trialEndsAt: endsAt.toISOString(),
    trialExpired: false,
    currentPeriodEnd: endsAt.toISOString(),
  });

  return { stored, created: true };
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
    .from(TABLE)
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
    return createDefaultStored(normalizedUserId);
  }

  let subscription = mapRow(data as UserSubscriptionRow);
  subscription = await expireTrialIfNeeded(subscription);
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
      isTrial: subscription.isTrial,
      trialStartedAt: subscription.trialStartedAt,
      trialEndsAt: subscription.trialEndsAt,
      trialExpired: subscription.trialExpired,
    }
  );
}

export async function setStoredPlan(
  userId: string,
  planId: PlanId,
  billingInterval: BillingInterval = "monthly",
  metadata: SubscriptionUpsertMetadata = {}
): Promise<StoredSubscription> {
  return upsertUserSubscription(userId, planId, billingInterval, {
    ...metadata,
    clearTrial: isPaidPlanId(planId) ? true : metadata.clearTrial,
  });
}

export async function listActiveTrialsForEmailJob(): Promise<StoredSubscription[]> {
  const db = requireSupabaseAdmin();
  const { data, error } = await db
    .from(TABLE)
    .select("*")
    .eq("is_trial", true)
    .eq("trial_expired", false);

  if (error) {
    throw new Error(`listActiveTrialsForEmailJob failed: ${formatPostgrestError(error)}`);
  }

  return (data as UserSubscriptionRow[]).map(mapRow);
}
