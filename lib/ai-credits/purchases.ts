import { getSupabaseAdmin, requireSupabaseAdmin } from "@/lib/supabase-admin";
import { formatPostgrestError } from "@/lib/supabase/db-log";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import type { BillingCurrency } from "@/lib/billing/currency";
import type { AiCreditPackId } from "./packs";

export type AiCreditPurchaseStatus = "pending" | "paid" | "failed" | "refunded";

export type AiCreditPurchaseRecord = {
  id: string;
  userId: string;
  packId: AiCreditPackId;
  credits: number;
  amount: number;
  currency: BillingCurrency;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  status: AiCreditPurchaseStatus;
  createdAt: string;
  paidAt: string | null;
};

type PurchaseRow = {
  id: string;
  user_id: string;
  pack_id: string;
  credits: number;
  amount: number;
  currency: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  status: string;
  created_at: string;
  paid_at: string | null;
};

const TABLE = "ai_credit_purchases";

function mapRow(row: PurchaseRow): AiCreditPurchaseRecord {
  return {
    id: row.id,
    userId: row.user_id,
    packId: row.pack_id as AiCreditPackId,
    credits: row.credits,
    amount: row.amount,
    currency: row.currency as BillingCurrency,
    razorpayOrderId: row.razorpay_order_id,
    razorpayPaymentId: row.razorpay_payment_id,
    status: row.status as AiCreditPurchaseStatus,
    createdAt: row.created_at,
    paidAt: row.paid_at,
  };
}

export async function createPendingCreditPurchase(input: {
  userId: string;
  packId: AiCreditPackId;
  credits: number;
  amount: number;
  currency: BillingCurrency;
  razorpayOrderId: string;
  workspaceId?: string | null;
}): Promise<AiCreditPurchaseRecord> {
  const db = requireSupabaseAdmin();
  const { data, error } = await db
    .from(TABLE)
    .insert({
      user_id: normalizeSubscriptionUserId(input.userId),
      pack_id: input.packId,
      credits: input.credits,
      amount: input.amount,
      currency: input.currency,
      razorpay_order_id: input.razorpayOrderId,
      status: "pending",
      workspace_id: input.workspaceId ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `createPendingCreditPurchase failed: ${formatPostgrestError(error)}`
    );
  }

  return mapRow(data as PurchaseRow);
}

export async function findCreditPurchaseByPaymentId(
  paymentId: string
): Promise<AiCreditPurchaseRecord | null> {
  const db = getSupabaseAdmin();
  if (!db) return null;
  const { data, error } = await db
    .from(TABLE)
    .select("*")
    .eq("razorpay_payment_id", paymentId)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as PurchaseRow);
}

export async function findCreditPurchaseByOrderId(
  orderId: string
): Promise<AiCreditPurchaseRecord | null> {
  const db = getSupabaseAdmin();
  if (!db) return null;
  const { data, error } = await db
    .from(TABLE)
    .select("*")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as PurchaseRow);
}

export async function markCreditPurchasePaid(input: {
  orderId: string;
  paymentId: string;
  userId: string;
}): Promise<AiCreditPurchaseRecord | null> {
  const existing = await findCreditPurchaseByPaymentId(input.paymentId);
  if (existing?.status === "paid") return existing;

  const db = requireSupabaseAdmin();
  const { data, error } = await db
    .from(TABLE)
    .update({
      status: "paid",
      razorpay_payment_id: input.paymentId,
      paid_at: new Date().toISOString(),
    })
    .eq("razorpay_order_id", input.orderId)
    .eq("user_id", normalizeSubscriptionUserId(input.userId))
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(
      `markCreditPurchasePaid failed: ${formatPostgrestError(error)}`
    );
  }

  if (data) return mapRow(data as PurchaseRow);

  return findCreditPurchaseByPaymentId(input.paymentId);
}

export async function listCreditPurchases(
  userId: string,
  limit = 20
): Promise<AiCreditPurchaseRecord[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];

  const { data, error } = await db
    .from(TABLE)
    .select("*")
    .eq("user_id", normalizeSubscriptionUserId(userId))
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as PurchaseRow[]).map(mapRow);
}

export async function addPurchasedCreditsBalance(
  userId: string,
  credits: number
): Promise<number> {
  const db = getSupabaseAdmin();
  if (!db) return credits;

  try {
    const { data, error } = await db.rpc("add_purchased_ai_credits", {
      p_user_id: normalizeSubscriptionUserId(userId),
      p_credits: credits,
    });
    if (!error && typeof data === "number") return data;
  } catch (err) {
    console.error("[ai-credits] add_purchased RPC failed:", err);
  }

  // Fallback upsert
  const { data: row } = await db
    .from("user_usage")
    .select("purchased_credits_remaining")
    .eq("user_id", normalizeSubscriptionUserId(userId))
    .maybeSingle();

  const current = Number(
    (row as { purchased_credits_remaining?: number } | null)
      ?.purchased_credits_remaining ?? 0
  );
  const next = current + credits;

  await db.from("user_usage").upsert({
    user_id: normalizeSubscriptionUserId(userId),
    purchased_credits_remaining: next,
    updated_at: new Date().toISOString(),
  });

  return next;
}
