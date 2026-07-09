import type { BillingPeriod, PaidPlanId } from "@/components/billing/pricing-data";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

export type ParsedRazorpayNotes = {
  userId?: string;
  planId?: string;
  period?: string;
  currency?: string;
  razorpayPlanId?: string;
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
  const planId = pickNote(record, "planId", "plan_id", "plan")?.toLowerCase();
  const period = pickNote(record, "period", "billing_period");
  const currency = pickNote(record, "currency");
  const razorpayPlanId = pickNote(record, "razorpayPlanId", "razorpay_plan_id");

  return {
    userId: userId ? normalizeSubscriptionUserId(userId) : undefined,
    planId,
    period,
    currency,
    razorpayPlanId,
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
