import Razorpay from "razorpay";
import crypto from "crypto";
import {
  RAZORPAY_CONNECTED,
  RAZORPAY_KEY_ID,
} from "./config";
import type { BillingPeriod, PlanId } from "@/components/billing/pricing-data";
import type { BillingCurrency } from "./currency";
import {
  getChargeAmount,
  getChargeDescription,
  isPaidPlan,
} from "./pricing";
import {
  getRazorpayKeyIdPrefix,
  getRazorpayKeyMode,
  getRazorpayPlanEnvKey,
  getRazorpayPlanId,
} from "./razorpay-plans";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

export function getRazorpayClient(): Razorpay {
  if (!RAZORPAY_CONNECTED) {
    throw new Error("Razorpay is not configured.");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

export async function createRazorpayOrder({
  userId,
  email,
  planId,
  period,
  currency,
}: {
  userId: string;
  email?: string;
  planId: PlanId;
  period: BillingPeriod;
  currency: BillingCurrency;
}) {
  if (!isPaidPlan(planId)) {
    throw new Error("This plan cannot be purchased via checkout.");
  }

  const normalizedUserId = normalizeSubscriptionUserId(userId);
  const normalizedEmail = email
    ? normalizeSubscriptionUserId(email)
    : normalizedUserId;
  const razorpayPlanId = getRazorpayPlanId(planId, period);
  const amount = getChargeAmount(currency, planId, period);

  if (!amount) {
    throw new Error("This plan cannot be purchased via checkout.");
  }

  const subscriptionPayload = {
    plan_id: razorpayPlanId,
    customer_notify: 1 as const,
    quantity: 1,
    total_count: period === "yearly" ? 10 : 120,
    notes: {
      userId: normalizedUserId,
      workspaceId: normalizedUserId,
      email: normalizedEmail,
      plan: planId,
      planId,
      billingCycle: period,
      period,
      currency,
      razorpayPlanId,
    },
  };

  console.log("[razorpay] Creating subscription", {
    keyIdPrefix: getRazorpayKeyIdPrefix(),
    keyMode: getRazorpayKeyMode(),
    appPlanId: planId,
    billingPeriod: period,
    planEnvKey: getRazorpayPlanEnvKey(planId, period),
    razorpayPlanId,
    payload: subscriptionPayload,
  });

  const razorpay = getRazorpayClient();

  // Reject leftover ₹1 / $0.01 test plans so production never charges ₹1 for Pro.
  try {
    const remotePlan = await razorpay.plans.fetch(razorpayPlanId);
    const remoteAmount = Number(
      (remotePlan as { item?: { amount?: number } }).item?.amount ?? 0
    );
    if (remoteAmount > 0 && remoteAmount <= 100) {
      throw new Error(
        `Razorpay plan ${razorpayPlanId} is priced at ${remoteAmount} (₹1/$0.01 test plan). ` +
          `Update RAZORPAY_*_PLAN_ID to the production Pro ($20 / ₹1,760) or Team ($69 / ₹6,072) plan.`
      );
    }
    if (remoteAmount > 0 && amount > 0) {
      const drift = Math.abs(remoteAmount - amount) / amount;
      if (drift > 0.2) {
        console.warn("[razorpay] Plan amount differs from app pricing", {
          razorpayPlanId,
          remoteAmount,
          expectedAmount: amount,
          currency,
        });
      }
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("test plan")
    ) {
      throw error;
    }
    console.warn("[razorpay] Could not pre-validate plan amount:", error);
  }

  const subscription = await razorpay.subscriptions.create(subscriptionPayload);

  return {
    subscriptionId: subscription.id,
    razorpayPlanId,
    amount,
    currency,
    keyId: RAZORPAY_KEY_ID,
    description: getChargeDescription(currency, planId, period),
  };
}

export function verifyRazorpayPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return expected === signature;
}

export function verifyRazorpaySubscriptionSignature({
  subscriptionId,
  paymentId,
  signature,
}: {
  subscriptionId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const body = `${paymentId}|${subscriptionId}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return expected === signature;
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error(
      "[razorpay] RAZORPAY_WEBHOOK_SECRET is not set — cannot verify webhook"
    );
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return expected === signature;
}

export async function cancelRazorpaySubscription(
  subscriptionId: string
): Promise<void> {
  const razorpay = getRazorpayClient();
  await razorpay.subscriptions.cancel(subscriptionId, true);
}

/** One-time Razorpay order for AI credit pack top-ups. */
export async function createRazorpayCreditTopUpOrder({
  userId,
  email,
  packId,
  credits,
  amount,
  currency,
}: {
  userId: string;
  email?: string;
  packId: string;
  credits: number;
  amount: number;
  currency: BillingCurrency;
}) {
  if (!RAZORPAY_CONNECTED) {
    throw new Error("Razorpay is not configured.");
  }
  if (!amount || amount < 1) {
    throw new Error("Invalid top-up amount.");
  }

  const normalizedUserId = normalizeSubscriptionUserId(userId);
  const normalizedEmail = email
    ? normalizeSubscriptionUserId(email)
    : normalizedUserId;

  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.create({
    amount,
    currency,
    receipt: `credits_${packId}_${Date.now()}`.slice(0, 40),
    notes: {
      type: "ai_credit_topup",
      userId: normalizedUserId,
      email: normalizedEmail,
      packId,
      credits: String(credits),
      currency,
    },
  });

  return {
    orderId: order.id,
    amount: Number(order.amount),
    currency: order.currency as BillingCurrency,
    keyId: RAZORPAY_KEY_ID,
    description: `${credits.toLocaleString("en-US")} AI Credits`,
  };
}
