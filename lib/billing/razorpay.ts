import Razorpay from "razorpay";
import crypto from "crypto";
import {
  RAZORPAY_CONNECTED,
  RAZORPAY_KEY_ID,
} from "./config";
import type { BillingPeriod, PaidPlanId, PlanId } from "@/components/billing/pricing-data";
import type { BillingCurrency } from "./currency";
import {
  getChargeAmount,
  getChargeDescription,
  isPaidPlan,
} from "./pricing";
import {
  getPlanLabel,
  getRazorpayKeyIdPrefix,
  getRazorpayKeyMode,
  getRazorpayPlanEnvKey,
  getRazorpayPlanId,
} from "./razorpay-plans";
import {
  formatInrPaise,
  getInrCheckoutDisclaimer,
} from "./exchange-rate";
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

/**
 * Creates a Razorpay plan with a live-converted INR amount.
 * Each checkout gets its own plan so the amount reflects the current exchange rate.
 * Renewals charge the same locked-in amount from subscription creation.
 */
async function createDynamicRazorpayPlan({
  planId,
  period,
  amountPaise,
}: {
  planId: PaidPlanId;
  period: BillingPeriod;
  amountPaise: number;
}): Promise<string> {
  if (amountPaise < 100) {
    throw new Error(
      `Invalid plan amount (${amountPaise} paise). Amount must be at least ₹1.`
    );
  }

  const razorpay = getRazorpayClient();
  const label = getPlanLabel(planId);
  const planName = `Actora ${label} — Monthly`;

  const plan = await razorpay.plans.create({
    period: "monthly",
    interval: 1,
    item: {
      name: planName,
      amount: amountPaise,
      currency: "INR",
      description: `${planName} (USD-priced, INR at checkout)`,
    },
  });

  const planIdValue = (plan as { id?: string }).id;
  if (!planIdValue) {
    throw new Error("Razorpay did not return a plan ID.");
  }

  console.log("[razorpay] Created dynamic INR plan", {
    razorpayPlanId: planIdValue,
    appPlanId: planId,
    period,
    amountPaise,
  });

  return planIdValue;
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

  const amount = await getChargeAmount(currency, planId, period);

  if (!amount) {
    throw new Error("This plan cannot be purchased via checkout.");
  }

  // INR: create a dynamic plan with live-converted amount.
  // USD via Razorpay: fall back to pre-configured dashboard plan IDs.
  const razorpayPlanId =
    currency === "INR"
      ? await createDynamicRazorpayPlan({
          planId,
          period,
          amountPaise: amount,
        })
      : getRazorpayPlanId(planId, period);

  const subscriptionPayload = {
    plan_id: razorpayPlanId,
    customer_notify: 1 as const,
    quantity: 1,
    total_count: 120,
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
      usdPriced: "true",
    },
  };

  console.log("[razorpay] Creating subscription", {
    keyIdPrefix: getRazorpayKeyIdPrefix(),
    keyMode: getRazorpayKeyMode(),
    appPlanId: planId,
    billingPeriod: period,
    planEnvKey:
      currency === "USD" ? getRazorpayPlanEnvKey(planId, period) : "dynamic",
    razorpayPlanId,
    currency,
    amount,
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
        `Razorpay plan ${razorpayPlanId} is priced at ${remoteAmount} (test plan). ` +
          `Contact support if this persists.`
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("test plan")) {
      throw error;
    }
    console.warn("[razorpay] Could not pre-validate plan amount:", error);
  }

  const subscription = await razorpay.subscriptions.create(subscriptionPayload);

  const inrDisclaimer =
    currency === "INR"
      ? getInrCheckoutDisclaimer(formatInrPaise(amount))
      : undefined;

  return {
    subscriptionId: subscription.id,
    razorpayPlanId,
    amount,
    currency,
    keyId: RAZORPAY_KEY_ID,
    description: getChargeDescription(currency, planId, period),
    approximateInrLabel: currency === "INR" ? formatInrPaise(amount) : undefined,
    exchangeRateNotice: inrDisclaimer,
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
      usdPriced: "true",
    },
  });

  const inrDisclaimer =
    currency === "INR"
      ? getInrCheckoutDisclaimer(formatInrPaise(amount))
      : undefined;

  return {
    orderId: order.id,
    amount: Number(order.amount),
    currency: order.currency as BillingCurrency,
    keyId: RAZORPAY_KEY_ID,
    description: `${credits.toLocaleString("en-US")} AI Credits`,
    approximateInrLabel: currency === "INR" ? formatInrPaise(amount) : undefined,
    exchangeRateNotice: inrDisclaimer,
  };
}
