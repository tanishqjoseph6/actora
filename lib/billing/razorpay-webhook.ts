import type { BillingPeriod, PaidPlanId } from "@/components/billing/pricing-data";
import { resolveAppPlanFromRazorpayPlanId } from "@/lib/billing/razorpay-plans";
import { subscriptionProvider } from "@/lib/subscription/provider";
import type { BillingInterval, PlanId } from "@/lib/subscription/types";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

/** Configure these events in the Razorpay Live dashboard webhook settings. */
export const RAZORPAY_WEBHOOK_EVENTS = [
  "subscription.activated",
  "subscription.charged",
  "payment.captured",
] as const;

export type RazorpayWebhookEvent = (typeof RAZORPAY_WEBHOOK_EVENTS)[number];

type RazorpayWebhookNotes = {
  userId?: string;
  planId?: string;
  period?: string;
  currency?: string;
  razorpayPlanId?: string;
};

type RazorpaySubscriptionEntity = {
  id?: string;
  plan_id?: string;
  status?: string;
  current_end?: number;
  notes?: RazorpayWebhookNotes;
};

type RazorpayPaymentEntity = {
  id?: string;
  status?: string;
  notes?: RazorpayWebhookNotes;
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
  "order.paid",
]);

function parseNotes(notes: unknown): RazorpayWebhookNotes | null {
  if (!notes || typeof notes !== "object") return null;
  return notes as RazorpayWebhookNotes;
}

function isPaidAppPlan(planId: string): planId is PaidPlanId {
  return planId === "pro" || planId === "starter";
}

function parseBillingPeriod(period: string | undefined): BillingInterval {
  return period === "yearly" ? "yearly" : "monthly";
}

function periodEndFromUnix(seconds?: number | null): string | undefined {
  if (seconds == null || !Number.isFinite(seconds)) return undefined;
  return new Date(seconds * 1000).toISOString();
}

function extractActivationContext(payload: RazorpayWebhookPayload): {
  userId: string;
  planId: PaidPlanId;
  period: BillingInterval;
  razorpayPlanId?: string;
  subscriptionId?: string;
  paymentId?: string;
  currentPeriodEnd?: string;
} | null {
  const subscription = payload.payload?.subscription?.entity;
  const payment = payload.payload?.payment?.entity;

  const subscriptionNotes = parseNotes(subscription?.notes);
  const paymentNotes = parseNotes(payment?.notes);

  let userId = subscriptionNotes?.userId ?? paymentNotes?.userId;
  if (userId) {
    userId = normalizeSubscriptionUserId(userId);
  }
  let planId = subscriptionNotes?.planId ?? paymentNotes?.planId;
  let period = parseBillingPeriod(
    subscriptionNotes?.period ?? paymentNotes?.period
  );
  let razorpayPlanId =
    subscriptionNotes?.razorpayPlanId ??
    paymentNotes?.razorpayPlanId ??
    subscription?.plan_id;

  if ((!planId || !isPaidAppPlan(planId)) && razorpayPlanId) {
    const resolved = resolveAppPlanFromRazorpayPlanId(razorpayPlanId);
    if (resolved) {
      planId = planId && isPaidAppPlan(planId) ? planId : resolved.planId;
      period = subscriptionNotes?.period || paymentNotes?.period
        ? period
        : resolved.period;
    }
  }

  if (!userId || !planId || !isPaidAppPlan(planId)) {
    return null;
  }

  return {
    userId,
    planId,
    period,
    razorpayPlanId,
    subscriptionId: subscription?.id,
    paymentId: payment?.id,
    currentPeriodEnd: periodEndFromUnix(subscription?.current_end),
  };
}

export async function handleRazorpayWebhook(
  payload: RazorpayWebhookPayload
): Promise<{ handled: boolean; event?: string; reason?: string }> {
  const event = payload.event ?? "unknown";

  if (!PLAN_ACTIVATION_EVENTS.has(event)) {
    console.log("[razorpay-webhook] Ignoring unsupported event:", event);
    return { handled: false, event, reason: "unsupported_event" };
  }

  const context = extractActivationContext(payload);
  if (!context) {
    console.warn("[razorpay-webhook] Could not resolve user/plan for event:", event, {
      subscriptionId: payload.payload?.subscription?.entity?.id,
      paymentId: payload.payload?.payment?.entity?.id,
      planId: payload.payload?.subscription?.entity?.plan_id,
    });
    return { handled: false, event, reason: "missing_context" };
  }

  await subscriptionProvider.setPlan(
    context.userId,
    context.planId as PlanId,
    context.period,
    {
      razorpaySubscriptionId: context.subscriptionId,
      razorpayPlanId: context.razorpayPlanId,
      currentPeriodEnd: context.currentPeriodEnd,
    }
  );

  console.log("[razorpay-webhook] Plan updated in database", {
    event,
    userId: context.userId,
    planId: context.planId,
    period: context.period,
    razorpayPlanId: context.razorpayPlanId,
    razorpaySubscriptionId: context.subscriptionId,
    currentPeriodEnd: context.currentPeriodEnd,
    paymentId: context.paymentId,
  });

  return { handled: true, event };
}
