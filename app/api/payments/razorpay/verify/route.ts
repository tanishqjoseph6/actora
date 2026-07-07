import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpaySubscriptionSignature,
  getRazorpayClient,
} from "@/lib/billing/razorpay";
import type { BillingPeriod, PlanId } from "@/components/billing/pricing-data";
import { isBillingCurrency } from "@/lib/billing/currency";
import { getRazorpayPlanId, isPaidPlan } from "@/lib/billing/pricing";
import {
  subscriptionProvider,
  toSubscriptionSnapshot,
} from "@/lib/subscription";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

type RazorpayNotes = Record<string, string | undefined>;

function parseNotes(notes: unknown): RazorpayNotes {
  if (!notes || typeof notes !== "object") return {};
  return notes as RazorpayNotes;
}

function noteMatches(
  actual: string | undefined,
  expected: string,
  options?: { ignoreCase?: boolean }
): boolean {
  if (!actual) return true;
  if (options?.ignoreCase) {
    return actual.trim().toLowerCase() === expected.trim().toLowerCase();
  }
  return actual.trim() === expected.trim();
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionEmail = session?.user?.email;

  console.log("[razorpay/verify] step:start", {
    hasSession: Boolean(sessionEmail),
    sessionEmail: sessionEmail ? `${sessionEmail.slice(0, 3)}…` : null,
  });

  if (!sessionEmail) {
    console.error("[razorpay/verify] step:auth — no session email");
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = normalizeSubscriptionUserId(sessionEmail);

  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      period,
      currency,
      razorpayPlanId,
    } = body as {
      razorpay_order_id?: string;
      razorpay_subscription_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      planId?: PlanId;
      period?: BillingPeriod;
      currency?: string;
      razorpayPlanId?: string;
    };

    console.log("[razorpay/verify] step:payload", {
      userId,
      planId,
      period,
      currency,
      hasPaymentId: Boolean(razorpay_payment_id),
      hasSignature: Boolean(razorpay_signature),
      hasSubscriptionId: Boolean(razorpay_subscription_id),
      hasOrderId: Boolean(razorpay_order_id),
      clientRazorpayPlanId: razorpayPlanId,
    });

    if (
      !razorpay_payment_id ||
      !razorpay_signature ||
      !planId ||
      !period ||
      !currency ||
      !isBillingCurrency(currency) ||
      (!razorpay_order_id && !razorpay_subscription_id)
    ) {
      console.error("[razorpay/verify] step:validate-fields — missing required fields");
      return NextResponse.json(
        { error: "Missing payment verification fields." },
        { status: 400 }
      );
    }

    if (!isPaidPlan(planId)) {
      console.error("[razorpay/verify] step:validate-plan — not a paid plan", { planId });
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }

    const expectedPlanId = getRazorpayPlanId(planId, period);
    if (razorpayPlanId && razorpayPlanId.trim() !== expectedPlanId) {
      console.error("[razorpay/verify] step:client-plan-mismatch", {
        clientRazorpayPlanId: razorpayPlanId,
        expectedPlanId,
      });
      return NextResponse.json(
        { error: "Razorpay plan does not match checkout selection." },
        { status: 400 }
      );
    }

    const isValid = razorpay_subscription_id
      ? verifyRazorpaySubscriptionSignature({
          subscriptionId: razorpay_subscription_id,
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
        })
      : verifyRazorpayPaymentSignature({
          orderId: razorpay_order_id!,
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
        });

    if (!isValid) {
      console.error("[razorpay/verify] step:signature — invalid payment signature", {
        mode: razorpay_subscription_id ? "subscription" : "order",
        subscriptionId: razorpay_subscription_id,
        paymentId: razorpay_payment_id,
      });
      return NextResponse.json(
        { error: "Payment verification failed." },
        { status: 400 }
      );
    }

    console.log("[razorpay/verify] step:signature — ok");

    const razorpay = getRazorpayClient();

    if (razorpay_subscription_id) {
      const subscription = await razorpay.subscriptions.fetch(
        razorpay_subscription_id
      );
      const notes = parseNotes(subscription.notes);
      const remotePlanId = subscription.plan_id?.trim();

      console.log("[razorpay/verify] step:subscription-fetch", {
        subscriptionId: razorpay_subscription_id,
        remotePlanId,
        expectedPlanId,
        notes,
        status: subscription.status,
      });

      if (remotePlanId !== expectedPlanId) {
        console.error("[razorpay/verify] step:subscription-plan-mismatch", {
          remotePlanId,
          expectedPlanId,
        });
        return NextResponse.json(
          { error: "Subscription plan does not match checkout." },
          { status: 400 }
        );
      }

      if (
        !noteMatches(notes.userId, userId, { ignoreCase: true }) ||
        !noteMatches(notes.planId, planId) ||
        !noteMatches(notes.period, period) ||
        !noteMatches(notes.currency, currency)
      ) {
        console.warn("[razorpay/verify] step:subscription-notes-mismatch — continuing with session user", {
          notes,
          userId,
          planId,
          period,
          currency,
        });
      }
    } else {
      const order = await razorpay.orders.fetch(razorpay_order_id!);
      const notes = parseNotes(order.notes);

      console.log("[razorpay/verify] step:order-fetch", { orderId: razorpay_order_id, notes });

      if (
        !noteMatches(notes.userId, userId, { ignoreCase: true }) ||
        !noteMatches(notes.planId, planId) ||
        !noteMatches(notes.period, period) ||
        !noteMatches(notes.currency, currency)
      ) {
        console.error("[razorpay/verify] step:order-notes-mismatch", {
          notes,
          userId,
          planId,
          period,
          currency,
        });
        return NextResponse.json(
          { error: "Order details do not match checkout." },
          { status: 400 }
        );
      }
    }

    console.log("[razorpay/verify] step:set-plan — writing to database", {
      userId,
      planId,
      period,
    });

    const updated = await subscriptionProvider.setPlan(userId, planId, period);

    console.log("[razorpay/verify] step:set-plan — success", {
      userId: updated.userId,
      planId: updated.planId,
      billingInterval: updated.billingInterval,
      updatedAt: updated.updatedAt,
    });

    return NextResponse.json({
      success: true,
      subscription: toSubscriptionSnapshot(updated),
      paymentId: razorpay_payment_id,
      razorpayPlanId: expectedPlanId,
    });
  } catch (error) {
    console.error("[razorpay/verify] step:error — unhandled exception", error);

    const message =
      error instanceof Error ? error.message : "Failed to verify payment.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
