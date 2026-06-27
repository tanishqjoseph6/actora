import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { verifyRazorpayPaymentSignature, getRazorpayClient } from "@/lib/billing/razorpay";
import type { BillingPeriod, PlanId } from "@/components/billing/pricing-data";
import { isPaidPlan } from "@/lib/billing/pricing";
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
      razorpay_payment_id,
      razorpay_signature,
      planId,
      period,
    } = body as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      planId?: PlanId;
      period?: BillingPeriod;
    };

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !planId ||
      !period
    ) {
      return NextResponse.json(
        { error: "Missing payment verification fields." },
        { status: 400 }
      );
    }

    if (!isPaidPlan(planId)) {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }

    const isValid = verifyRazorpayPaymentSignature({
      orderId: razorpay_order_id,
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
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const notes = order.notes as
      | { userId?: string; planId?: PlanId; period?: BillingPeriod }
      | undefined;

    if (
      notes?.userId !== userId ||
      notes?.planId !== planId ||
      notes?.period !== period
    ) {
      return NextResponse.json(
        { error: "Order details do not match checkout." },
        { status: 400 }
      );
    }

    const updated = await subscriptionProvider.setPlan(userId, planId, period);

    return NextResponse.json({
      success: true,
      subscription: toSubscriptionSnapshot(updated),
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error("[razorpay] Payment verification failed:", error);

    return NextResponse.json(
      { error: "Failed to verify payment." },
      { status: 500 }
    );
  }
}
