import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { isBillingCurrency } from "@/lib/billing/currency";
import {
  getPaymentProviderForCurrency,
  isCheckoutAvailable,
} from "@/lib/billing/providers";
import type { BillingPeriod, PlanId } from "@/components/billing/pricing-data";
import { isPaidPlan } from "@/lib/billing/pricing";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { planId, period, currency } = body as {
      planId?: PlanId;
      period?: BillingPeriod;
      currency?: string;
    };

    if (!currency || !isBillingCurrency(currency)) {
      return NextResponse.json(
        { error: "Invalid or missing currency." },
        { status: 400 }
      );
    }

    if (!isCheckoutAvailable(currency)) {
      return NextResponse.json(
        { error: "Checkout is not configured for this currency." },
        { status: 503 }
      );
    }

    if (!planId || !isPaidPlan(planId)) {
      return NextResponse.json(
        { error: "Invalid plan for checkout." },
        { status: 400 }
      );
    }

    if (period !== "monthly" && period !== "yearly") {
      return NextResponse.json(
        { error: "Invalid billing period." },
        { status: 400 }
      );
    }

    const provider = getPaymentProviderForCurrency(currency);
    const order = await provider.createOrder({
      userId,
      planId,
      period,
      currency,
    });

    return NextResponse.json({
      provider: order.provider,
      orderId: order.orderId,
      subscriptionId: order.subscriptionId,
      razorpayPlanId: order.razorpayPlanId,
      amount: order.amount,
      currency: order.currency,
      keyId: order.keyId,
      description: order.description,
    });
  } catch (error) {
    console.error("[checkout] Failed to create order:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create payment order.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
