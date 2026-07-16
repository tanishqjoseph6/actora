import { getSupabaseAdmin, requireSupabaseAdmin } from "@/lib/supabase-admin";
import { formatPostgrestError } from "@/lib/supabase/db-log";
import type { BillingPaymentRow } from "@/lib/supabase/database.types";
import type { BillingInterval, PlanId } from "@/lib/subscription/types";
import type { BillingCurrency } from "./currency";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

export type BillingPaymentRecord = {
  id: string;
  userId: string;
  planId: PlanId;
  billingInterval: BillingInterval;
  amount: number;
  currency: BillingCurrency;
  razorpayPaymentId: string | null;
  razorpayOrderId: string | null;
  razorpaySubscriptionId: string | null;
  status: "paid" | "failed" | "refunded";
  createdAt: string;
};

const TABLE = "billing_payments";

function mapRow(row: BillingPaymentRow): BillingPaymentRecord {
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id as PlanId,
    billingInterval: row.billing_interval as BillingInterval,
    amount: row.amount,
    currency: row.currency as BillingCurrency,
    razorpayPaymentId: row.razorpay_payment_id,
    razorpayOrderId: row.razorpay_order_id,
    razorpaySubscriptionId: row.razorpay_subscription_id,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function findPaymentByRazorpayId(
  razorpayPaymentId: string
): Promise<BillingPaymentRecord | null> {
  const db = getSupabaseAdmin();
  if (!db) return null;

  const { data, error } = await db
    .from(TABLE)
    .select("*")
    .eq("razorpay_payment_id", razorpayPaymentId)
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(data as BillingPaymentRow);
}

export async function recordBillingPayment(input: {
  userId: string;
  planId: PlanId;
  billingInterval: BillingInterval;
  amount: number;
  currency: BillingCurrency;
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
  razorpaySubscriptionId?: string | null;
  status?: "paid" | "failed" | "refunded";
}): Promise<BillingPaymentRecord | null> {
  if (!input.razorpayPaymentId) return null;

  const existing = await findPaymentByRazorpayId(input.razorpayPaymentId);
  if (existing) return existing;

  const db = requireSupabaseAdmin();
  const row = {
    user_id: normalizeSubscriptionUserId(input.userId),
    plan_id: input.planId,
    billing_interval: input.billingInterval,
    amount: input.amount,
    currency: input.currency,
    razorpay_payment_id: input.razorpayPaymentId,
    razorpay_order_id: input.razorpayOrderId ?? null,
    razorpay_subscription_id: input.razorpaySubscriptionId ?? null,
    status: input.status ?? "paid",
  };

  const { data, error } = await db
    .from(TABLE)
    .insert(row)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return findPaymentByRazorpayId(input.razorpayPaymentId);
    }
    throw new Error(`recordBillingPayment failed: ${formatPostgrestError(error)}`);
  }

  return mapRow(data as BillingPaymentRow);
}

export async function listBillingPayments(
  userId: string,
  limit = 20
): Promise<BillingPaymentRecord[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];

  const normalizedUserId = normalizeSubscriptionUserId(userId);
  const { data, error } = await db
    .from(TABLE)
    .select("*")
    .eq("user_id", normalizedUserId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as BillingPaymentRow[]).map(mapRow);
}
