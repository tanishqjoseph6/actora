import Razorpay from "razorpay";
import crypto from "crypto";
import {
  RAZORPAY_CONNECTED,
  RAZORPAY_CURRENCY,
  RAZORPAY_KEY_ID,
} from "./config";
import type { BillingPeriod, PlanId } from "@/components/billing/pricing-data";
import { getChargeAmount, getChargeDescription } from "./pricing";

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
}: {
  userId: string;
  planId: PlanId;
  period: BillingPeriod;
}) {
  const amount = getChargeAmount(planId, period);

  if (!amount) {
    throw new Error("This plan cannot be purchased via checkout.");
  }

  const razorpay = getRazorpayClient();

  const order = await razorpay.orders.create({
    amount,
    currency: RAZORPAY_CURRENCY,
    receipt: `actora_${planId}_${period}_${Date.now()}`,
    notes: {
      userId,
      planId,
      period,
    },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: RAZORPAY_KEY_ID,
    description: getChargeDescription(planId, period),
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
