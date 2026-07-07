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
  planId,
  period,
  currency,
}: {
  userId: string;
  planId: PlanId;
  period: BillingPeriod;
  currency: BillingCurrency;
}) {
  if (!isPaidPlan(planId)) {
    throw new Error("This plan cannot be purchased via checkout.");
  }

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
      userId,
      planId,
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
