import type { BillingPeriod, PaidPlanId } from "@/components/billing/pricing-data";
import { getRazorpayClient, cancelRazorpaySubscription } from "@/lib/billing/razorpay";
import {
  isPaidAppPlan,
  parseBillingPeriod,
  parseRazorpayNotes,
} from "@/lib/billing/razorpay-notes";
import { resolveAppPlanFromRazorpayPlanId } from "@/lib/billing/razorpay-plans";
import { getChargeAmount } from "@/lib/billing/pricing";
import { recordBillingPayment } from "@/lib/billing/payment-repository";
import { isBillingCurrency, type BillingCurrency } from "@/lib/billing/currency";
import { logApiError } from "@/lib/api/log-error";
import {
  getStoredSubscription,
  setStoredPlan,
} from "@/lib/subscription/repository";
import type { BillingInterval, PlanId } from "@/lib/subscription/types";
import {
  addPurchasedCreditsBalance,
  findCreditPurchaseByOrderId,
  findCreditPurchaseByPaymentId,
  markCreditPurchasePaid,
} from "@/lib/ai-credits/purchases";
import { getAiCreditPack, isAiCreditPackId } from "@/lib/ai-credits/packs";
import { sendCreditPurchaseConfirmationEmail } from "@/lib/email/billing-emails";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

/** Configure these events in the Razorpay Live dashboard webhook settings. */
export const RAZORPAY_WEBHOOK_EVENTS = [
  "subscription.activated",
  "subscription.charged",
  "payment.captured",
] as const;

export type RazorpayWebhookEvent = (typeof RAZORPAY_WEBHOOK_EVENTS)[number];

type RazorpaySubscriptionEntity = {
  id?: string;
  plan_id?: string;
  status?: string;
  current_end?: number;
  notes?: unknown;
};

type RazorpayPaymentEntity = {
  id?: string;
  status?: string;
  notes?: unknown;
  subscription_id?: string;
  order_id?: string;
};

export type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    subscription?: { entity?: RazorpaySubscriptionEntity };
    payment?: { entity?: RazorpayPaymentEntity };
  };
};

const PLAN_ACTIVATION_EVENTS = new Set<string>([
  "subscription.activated",
  "subscription.charged",
  "payment.captured",
]);

/** Only skip upsert for terminal subscription states. */
const BLOCKED_SUBSCRIPTION_STATUSES = new Set([
  "cancelled",
  "canceled",
  "halted",
  "expired",
  "completed",
]);

function periodEndFromUnix(seconds?: number | null): string | undefined {
  if (seconds == null || !Number.isFinite(seconds)) return undefined;
  return new Date(seconds * 1000).toISOString();
}

async function fetchSubscriptionEntity(
  subscriptionId: string
): Promise<RazorpaySubscriptionEntity | null> {
  try {
    const razorpay = getRazorpayClient();
    const subscription = await razorpay.subscriptions.fetch(subscriptionId);
    return subscription as RazorpaySubscriptionEntity;
  } catch (error) {
    logApiError("razorpay-webhook", error, {
      operation: "fetchSubscriptionEntity",
      subscriptionId,
    });
    return null;
  }
}

async function extractActivationContext(
  payload: RazorpayWebhookPayload
): Promise<{
  userId: string;
  planId: PaidPlanId;
  period: BillingInterval;
  razorpayPlanId?: string;
  subscriptionId?: string;
  paymentId?: string;
  currentPeriodEnd?: string;
} | null> {
  let subscription = payload.payload?.subscription?.entity;
  const payment = payload.payload?.payment?.entity;

  if (!subscription?.id && payment?.subscription_id) {
    console.log("[razorpay-webhook] fetching subscription for payment", {
      subscriptionId: payment.subscription_id,
      paymentId: payment.id,
    });
    subscription =
      (await fetchSubscriptionEntity(payment.subscription_id)) ?? undefined;
  }

  const subscriptionNotes = parseRazorpayNotes(subscription?.notes);
  const paymentNotes = parseRazorpayNotes(payment?.notes);

  const userId = subscriptionNotes?.userId ?? paymentNotes?.userId;
  let planId = subscriptionNotes?.planId ?? paymentNotes?.planId;
  let period = parseBillingPeriod(
    subscriptionNotes?.period ?? paymentNotes?.period
  );

  const razorpayPlanId =
    subscriptionNotes?.razorpayPlanId ??
    paymentNotes?.razorpayPlanId ??
    subscription?.plan_id;

  if ((!planId || !isPaidAppPlan(planId)) && razorpayPlanId) {
    const resolved = resolveAppPlanFromRazorpayPlanId(razorpayPlanId);
    if (resolved) {
      planId = planId && isPaidAppPlan(planId) ? planId : resolved.planId;
      period =
        subscriptionNotes?.period || paymentNotes?.period
          ? period
          : resolved.period;
    }
  }

  const status = subscription?.status?.toLowerCase();
  if (status && BLOCKED_SUBSCRIPTION_STATUSES.has(status)) {
    console.warn("[razorpay-webhook] blocked subscription status", {
      subscriptionId: subscription?.id,
      status: subscription?.status,
    });
    return null;
  }

  if (!userId || !planId || !isPaidAppPlan(planId)) {
    return null;
  }

  return {
    userId,
    planId,
    period,
    razorpayPlanId,
    subscriptionId: subscription?.id ?? payment?.subscription_id,
    paymentId: payment?.id,
    currentPeriodEnd: periodEndFromUnix(subscription?.current_end),
  };
}

export async function handleRazorpayWebhook(
  payload: RazorpayWebhookPayload
): Promise<{ handled: boolean; event?: string; reason?: string }> {
  const event = payload.event ?? "unknown";

  console.log("[razorpay-webhook] step:received", {
    event,
    subscriptionId: payload.payload?.subscription?.entity?.id,
    subscriptionStatus: payload.payload?.subscription?.entity?.status,
    subscriptionPlanId: payload.payload?.subscription?.entity?.plan_id,
    subscriptionNotes: payload.payload?.subscription?.entity?.notes,
    paymentId: payload.payload?.payment?.entity?.id,
    paymentSubscriptionId: payload.payload?.payment?.entity?.subscription_id,
    paymentNotes: payload.payload?.payment?.entity?.notes,
  });

  if (!PLAN_ACTIVATION_EVENTS.has(event)) {
    console.log("[razorpay-webhook] ignoring unsupported event:", event);
    return { handled: false, event, reason: "unsupported_event" };
  }

  const payment = payload.payload?.payment?.entity;
  const paymentNotes = parseRazorpayNotes(payment?.notes);

  if (event === "payment.captured" && paymentNotes?.type === "ai_credit_topup") {
    const result = await fulfillCreditTopUpFromWebhook({
      paymentId: payment?.id,
      orderId: payment?.order_id,
      notes: paymentNotes,
    });
    return { handled: true, event, reason: result.reason };
  }

  const context = await extractActivationContext(payload);
  if (!context) {
    // Credit top-ups without plan context should not 500 and retry forever.
    if (paymentNotes?.type === "ai_credit_topup") {
      return { handled: true, event, reason: "ai_credit_topup_no_plan" };
    }
    console.error("[razorpay-webhook] step:missing_context", {
      event,
      subscriptionId: payload.payload?.subscription?.entity?.id,
      paymentId: payload.payload?.payment?.entity?.id,
      subscriptionNotes: payload.payload?.subscription?.entity?.notes,
      paymentNotes: payload.payload?.payment?.entity?.notes,
      subscriptionPlanId: payload.payload?.subscription?.entity?.plan_id,
    });
    throw new Error(
      `Could not resolve user/plan for Razorpay event ${event}. Razorpay will retry.`
    );
  }

  console.log("[razorpay-webhook] step:upsert", {
    event,
    userId: context.userId,
    planId: context.planId,
    period: context.period,
    razorpayPlanId: context.razorpayPlanId,
    razorpaySubscriptionId: context.subscriptionId,
    paymentId: context.paymentId,
    currentPeriodEnd: context.currentPeriodEnd,
  });

  const previous = await getStoredSubscription(context.userId);
  const previousSubscriptionId =
    previous.razorpaySubscriptionId?.trim() || null;
  const nextSubscriptionId = context.subscriptionId?.trim() || null;

  const stored = await setStoredPlan(
    context.userId,
    context.planId as PlanId,
    context.period,
    {
      razorpaySubscriptionId: context.subscriptionId,
      razorpayPlanId: context.razorpayPlanId,
      razorpayPaymentId: context.paymentId,
      currentPeriodEnd: context.currentPeriodEnd,
    }
  );

  if (
    previousSubscriptionId &&
    nextSubscriptionId &&
    previousSubscriptionId !== nextSubscriptionId
  ) {
    try {
      await cancelRazorpaySubscription(previousSubscriptionId);
      console.log("[razorpay-webhook] step:cancel-previous — ok", {
        previousSubscriptionId,
        nextSubscriptionId,
      });
    } catch (cancelError) {
      logApiError("razorpay-webhook", cancelError, {
        operation: "cancelPreviousSubscription",
        previousSubscriptionId,
        nextSubscriptionId,
      });
    }
  }

  if (context.paymentId) {
    try {
      const paymentNotes = parseRazorpayNotes(
        payload.payload?.payment?.entity?.notes
      );
      const subscriptionNotes = parseRazorpayNotes(
        payload.payload?.subscription?.entity?.notes
      );
      const rawCurrency =
        paymentNotes?.currency ?? subscriptionNotes?.currency ?? "USD";
      const currency: BillingCurrency = isBillingCurrency(rawCurrency)
        ? rawCurrency
        : "USD";
      const amount =
        getChargeAmount(currency, context.planId, context.period) ?? 0;
      await recordBillingPayment({
        userId: context.userId,
        planId: context.planId,
        billingInterval: context.period,
        amount,
        currency,
        razorpayPaymentId: context.paymentId,
        razorpaySubscriptionId: context.subscriptionId,
        status: "paid",
      });
    } catch (error) {
      logApiError("razorpay-webhook", error, {
        operation: "recordBillingPayment",
        paymentId: context.paymentId,
      });
    }
  }

  console.log("[razorpay-webhook] step:upsert-success", {
    event,
    userId: stored.userId,
    planId: stored.planId,
    razorpaySubscriptionId: stored.razorpaySubscriptionId,
    razorpayPlanId: stored.razorpayPlanId,
    updatedAt: stored.updatedAt,
  });

  return { handled: true, event };
}

async function fulfillCreditTopUpFromWebhook(input: {
  paymentId?: string;
  orderId?: string;
  notes: NonNullable<ReturnType<typeof parseRazorpayNotes>>;
}): Promise<{ reason: string }> {
  const paymentId = input.paymentId?.trim();
  const orderId = input.orderId?.trim();
  if (!paymentId) {
    return { reason: "missing_payment_id" };
  }

  const existing = await findCreditPurchaseByPaymentId(paymentId);
  if (existing?.status === "paid") {
    return { reason: "already_paid" };
  }

  const pending = orderId ? await findCreditPurchaseByOrderId(orderId) : null;
  if (!pending) {
    return { reason: orderId ? "purchase_not_found" : "missing_order" };
  }

  const marked = await markCreditPurchasePaid({
    orderId: pending.razorpayOrderId ?? orderId ?? "",
    paymentId,
    userId: pending.userId,
  });

  if (!marked) {
    return { reason: "mark_paid_failed" };
  }

  if (marked.newlyPaid) {
    await addPurchasedCreditsBalance(pending.userId, marked.purchase.credits);
    const pack = isAiCreditPackId(marked.purchase.packId)
      ? getAiCreditPack(marked.purchase.packId)
      : null;
    const amountLabel =
      marked.purchase.currency === "USD"
        ? `$${(marked.purchase.amount / 100).toFixed(2)}`
        : `₹${Math.round(marked.purchase.amount / 100).toLocaleString("en-IN")}`;
    const to =
      input.notes.email ??
      normalizeSubscriptionUserId(input.notes.userId ?? pending.userId);
    void sendCreditPurchaseConfirmationEmail({
      to,
      packName: pack?.name ?? "AI Credits",
      credits: marked.purchase.credits,
      amountLabel,
    }).catch((err) => {
      console.error("[razorpay-webhook] credit email failed:", err);
    });
    return { reason: "credits_granted" };
  }

  return { reason: "already_processed" };
}
