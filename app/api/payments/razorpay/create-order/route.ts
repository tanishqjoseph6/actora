import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isRazorpayCheckoutAvailable } from "@/lib/billing/config";
import { createRazorpayOrder } from "@/lib/billing/razorpay";
import type { BillingPeriod, PlanId } from "@/components/billing/pricing-data";
import { isPaidPlan } from "@/lib/billing/pricing";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!isRazorpayCheckoutAvailable()) {
    return NextResponse.json(
      { error: "Razorpay is not configured." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { planId, period } = body as {
      planId?: PlanId;
      period?: BillingPeriod;
    };

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

    const order = await createRazorpayOrder({
      userId,
      planId,
      period,
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("[razorpay] Failed to create order:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create payment order.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
