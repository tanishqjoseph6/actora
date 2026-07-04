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
  getRazorpayPlanId,
  isPaidPlan,
} from "./pricing";

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

  if (!razorpayPlanId || !amount) {
    throw new Error("This plan cannot be purchased via checkout.");
  }

  const razorpay = getRazorpayClient();

  const subscription = await razorpay.subscriptions.create({
    plan_id: razorpayPlanId,
    customer_notify: 1,
    quantity: 1,
    total_count: period === "yearly" ? 10 : 120,
    notes: {
      userId,
      planId,
      period,
      currency,
      razorpayPlanId,
    },
  });

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
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return expected === signature;
}
