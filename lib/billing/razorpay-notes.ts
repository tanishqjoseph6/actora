import type { BillingPeriod, PaidPlanId } from "@/components/billing/pricing-data";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

export type ParsedRazorpayNotes = {
  userId?: string;
  workspaceId?: string;
  email?: string;
  planId?: string;
  period?: string;
  billingCycle?: string;
  currency?: string;
  razorpayPlanId?: string;
  type?: string;
  packId?: string;
  credits?: string;
  orderId?: string;
};

/** Razorpay sends notes as string key-value pairs; normalize all access paths. */
export function parseRazorpayNotes(notes: unknown): ParsedRazorpayNotes | null {
  if (!notes) return null;

  let record: Record<string, unknown>;

  if (typeof notes === "string") {
    try {
      record = JSON.parse(notes) as Record<string, unknown>;
    } catch {
      return null;
    }
  } else if (typeof notes === "object") {
    record = notes as Record<string, unknown>;
  } else {
    return null;
  }

  const userId = pickNote(record, "userId", "user_id", "email");
  const workspaceId = pickNote(record, "workspaceId", "workspace_id");
  const email = pickNote(record, "email");
  const planId = pickNote(record, "planId", "plan_id", "plan")?.toLowerCase();
  const period = pickNote(record, "period", "billing_period", "billingCycle");
  const currency = pickNote(record, "currency");
  const razorpayPlanId = pickNote(record, "razorpayPlanId", "razorpay_plan_id");
  const type = pickNote(record, "type");
  const packId = pickNote(record, "packId", "pack_id");
  const credits = pickNote(record, "credits");
  const orderId = pickNote(record, "orderId", "order_id", "razorpayOrderId");

  return {
    userId: userId ? normalizeSubscriptionUserId(userId) : undefined,
    workspaceId: workspaceId
      ? normalizeSubscriptionUserId(workspaceId)
      : undefined,
    email: email ? normalizeSubscriptionUserId(email) : undefined,
    planId,
    period,
    billingCycle: period,
    currency,
    razorpayPlanId,
    type,
    packId,
    credits,
    orderId,
  };
}

function pickNote(
  notes: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = notes[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

export function isPaidAppPlan(planId: string): planId is PaidPlanId {
  return planId === "pro" || planId === "starter";
}

export function parseBillingPeriod(period: string | undefined): BillingPeriod {
  return period === "yearly" ? "yearly" : "monthly";
}
