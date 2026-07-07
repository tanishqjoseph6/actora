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

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

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

    if (
      !razorpay_payment_id ||
      !razorpay_signature ||
      !planId ||
      !period ||
      !currency ||
      !isBillingCurrency(currency) ||
      (!razorpay_order_id && !razorpay_subscription_id)
    ) {
      return NextResponse.json(
        { error: "Missing payment verification fields." },
        { status: 400 }
      );
    }

    if (!isPaidPlan(planId)) {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }

    const expectedPlanId = getRazorpayPlanId(planId, period);
    if (razorpayPlanId && razorpayPlanId !== expectedPlanId) {
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
      return NextResponse.json(
        { error: "Payment verification failed." },
        { status: 400 }
      );
    }

    const razorpay = getRazorpayClient();

    if (razorpay_subscription_id) {
      const subscription = await razorpay.subscriptions.fetch(
        razorpay_subscription_id
      );
      const notes = subscription.notes as
        | {
            userId?: string;
            planId?: PlanId;
            period?: BillingPeriod;
            currency?: string;
            razorpayPlanId?: string;
          }
        | undefined;

      if (
        notes?.userId !== userId ||
        notes?.planId !== planId ||
        notes?.period !== period ||
        notes?.currency !== currency ||
        notes?.razorpayPlanId !== expectedPlanId
      ) {
        return NextResponse.json(
          { error: "Subscription details do not match checkout." },
          { status: 400 }
        );
      }
    } else {
      const order = await razorpay.orders.fetch(razorpay_order_id!);
      const notes = order.notes as
        | {
            userId?: string;
            planId?: PlanId;
            period?: BillingPeriod;
            currency?: string;
            razorpayPlanId?: string;
          }
        | undefined;

      if (
        notes?.userId !== userId ||
        notes?.planId !== planId ||
        notes?.period !== period ||
        notes?.currency !== currency
      ) {
        return NextResponse.json(
          { error: "Order details do not match checkout." },
          { status: 400 }
        );
      }
    }

    const updated = await subscriptionProvider.setPlan(userId, planId, period);

    return NextResponse.json({
      success: true,
      subscription: toSubscriptionSnapshot(updated),
      paymentId: razorpay_payment_id,
      razorpayPlanId: expectedPlanId,
    });
  } catch (error) {
    console.error("[razorpay] Payment verification failed:", error);

    return NextResponse.json(
      { error: "Failed to verify payment." },
      { status: 500 }
    );
  }
}
