import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import {
  getPaymentProviderForCurrency,
  isCheckoutAvailableServer,
} from "@/lib/billing/providers";
import { resolvePaymentCurrency } from "@/lib/billing/payment-region";
import type { BillingPeriod, PaidPlanId, PlanId } from "@/components/billing/pricing-data";
import { isPaidPlan } from "@/lib/billing/pricing";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionEmail = session?.user?.email;

  if (!sessionEmail) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = normalizeSubscriptionUserId(sessionEmail);

  try {
    const body = await request.json();
    const { planId, period } = body as {
      planId?: PlanId;
      period?: BillingPeriod;
      currency?: string;
    };

    // Payment currency is determined server-side from geo — never trust client amounts.
    const currency = resolvePaymentCurrency(request);

    if (!isCheckoutAvailableServer(currency)) {
      return NextResponse.json(
        { error: "Checkout is not configured for this region." },
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
      email: sessionEmail,
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
      approximateInrLabel: order.approximateInrLabel,
      exchangeRateNotice: order.exchangeRateNotice,
    });
  } catch (error) {
    console.error("[checkout] Failed to create order:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create payment order.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Preview checkout amounts before opening Razorpay (INR disclaimer for Indian users). */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const planIdParam = searchParams.get("planId");
  const periodParam = searchParams.get("period");
  const currency = resolvePaymentCurrency(request);

  const period: BillingPeriod =
    periodParam === "yearly" ? "yearly" : "monthly";

  if (
    !planIdParam ||
    !isPaidPlan(planIdParam as PlanId) ||
    (periodParam !== "monthly" && periodParam !== "yearly")
  ) {
    return NextResponse.json({ error: "Invalid preview parameters." }, { status: 400 });
  }

  const planId = planIdParam as PaidPlanId;

  try {
    if (currency === "INR") {
      const { getInrCheckoutPreview } = await import(
        "@/lib/billing/pricing-amounts"
      );
      const { getInrCheckoutDisclaimer } = await import(
        "@/lib/billing/exchange-rate"
      );
      const preview = await getInrCheckoutPreview(planId, period);
      return NextResponse.json({
        currency,
        usdLabel: preview.usdLabel,
        approximateInrLabel: preview.inrLabel,
        exchangeRateNotice: getInrCheckoutDisclaimer(preview.inrLabel),
        exchangeRate: preview.exchangeRate,
      });
    }

    const { getUsdPriceLabel, getUsdChargeAmount } = await import(
      "@/lib/billing/pricing-amounts"
    );
    return NextResponse.json({
      currency: "USD",
      usdLabel: getUsdPriceLabel(planId, period),
      usdCents: getUsdChargeAmount(planId, period),
    });
  } catch (error) {
    console.error("[checkout/preview] Failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to preview checkout amount.",
      },
      { status: 500 }
    );
  }
}
