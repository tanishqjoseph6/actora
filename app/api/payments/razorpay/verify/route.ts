import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { logApiError } from "@/lib/api/log-error";
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpaySubscriptionSignature,
  getRazorpayClient,
} from "@/lib/billing/razorpay";
import type { BillingPeriod, PlanId } from "@/components/billing/pricing-data";
import { isBillingCurrency } from "@/lib/billing/currency";
import { getRazorpayPlanId, isPaidPlan } from "@/lib/billing/pricing";
import { parseRazorpayNotes } from "@/lib/billing/razorpay-notes";
import {
  subscriptionProvider,
  toSubscriptionSnapshot,
  type SubscriptionUpsertMetadata,
} from "@/lib/subscription";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

function noteMatches(
  actual: string | undefined,
  expected: string,
  options?: { ignoreCase?: boolean; required?: boolean }
): boolean {
  if (!actual) return !options?.required;
  if (options?.ignoreCase) {
    return actual.trim().toLowerCase() === expected.trim().toLowerCase();
  }
  return actual.trim() === expected.trim();
}

function periodEndFromUnix(seconds?: number | null): string | undefined {
  if (seconds == null || !Number.isFinite(seconds)) return undefined;
  return new Date(seconds * 1000).toISOString();
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
    let upsertMetadata: SubscriptionUpsertMetadata = {
      razorpayPlanId: expectedPlanId,
      razorpaySubscriptionId: razorpay_subscription_id,
    };

    if (razorpay_subscription_id) {
      const subscription = await razorpay.subscriptions.fetch(
        razorpay_subscription_id
      );
      const notes = parseRazorpayNotes(subscription.notes);
      const remotePlanId = subscription.plan_id?.trim();
      const currentEnd = periodEndFromUnix(
        (subscription as { current_end?: number }).current_end
      );

      upsertMetadata = {
        razorpaySubscriptionId: razorpay_subscription_id,
        razorpayPlanId: expectedPlanId,
        currentPeriodEnd: currentEnd,
      };

      console.log("[razorpay/verify] step:subscription-fetch", {
        subscriptionId: razorpay_subscription_id,
        remotePlanId,
        expectedPlanId,
        notes,
        status: subscription.status,
        currentPeriodEnd: currentEnd,
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
        notes?.userId &&
        !noteMatches(notes.userId, userId, { ignoreCase: true, required: true })
      ) {
        console.error("[razorpay/verify] step:subscription-user-mismatch", {
          notes,
          userId,
        });
        return NextResponse.json(
          { error: "Subscription does not belong to this account." },
          { status: 403 }
        );
      }

      if (
        (notes?.planId && !noteMatches(notes.planId, planId, { required: true })) ||
        (notes?.period && !noteMatches(notes.period, period, { required: true })) ||
        (notes?.currency && !noteMatches(notes.currency, currency, { required: true }))
      ) {
        console.warn("[razorpay/verify] step:subscription-notes-mismatch — continuing", {
          notes,
          userId,
          planId,
          period,
          currency,
        });
      }
    } else {
      const order = await razorpay.orders.fetch(razorpay_order_id!);
      const notes = parseRazorpayNotes(order.notes);

      console.log("[razorpay/verify] step:order-fetch", { orderId: razorpay_order_id, notes });

      if (
        !noteMatches(notes?.userId, userId, { ignoreCase: true }) ||
        !noteMatches(notes?.planId, planId) ||
        !noteMatches(notes?.period, period) ||
        !noteMatches(notes?.currency, currency)
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
      upsertMetadata,
    });

    const stored = await subscriptionProvider.setPlan(
      userId,
      planId,
      period,
      upsertMetadata
    );

    console.log("[razorpay/verify] step:upsert — success", {
      userId: stored.userId,
      planId: stored.planId,
      billingInterval: stored.billingInterval,
      updatedAt: stored.updatedAt,
    });

    const snapshot = toSubscriptionSnapshot(stored);

    return NextResponse.json({
      success: true,
      subscription: snapshot,
      paymentId: razorpay_payment_id,
      razorpayPlanId: expectedPlanId,
    });
  } catch (error) {
    logApiError("razorpay/verify", error, { userId });

    const message =
      error instanceof Error ? error.message : "Failed to verify payment.";

    return NextResponse.json(
      { error: message, details: message },
      { status: 500 }
    );
  }
}
