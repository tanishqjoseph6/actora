import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { isBillingCurrency } from "@/lib/billing/currency";
import { isCheckoutAvailableServer } from "@/lib/billing/providers";
import { createRazorpayCreditTopUpOrder } from "@/lib/billing/razorpay";
import {
  getAiCreditPack,
  getAiCreditPackAmount,
  isAiCreditPackId,
} from "@/lib/ai-credits/packs";
import { createPendingCreditPurchase } from "@/lib/ai-credits/purchases";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import { RAZORPAY_CONNECTED } from "@/lib/billing/config";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionEmail = session?.user?.email;
  if (!sessionEmail) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = normalizeSubscriptionUserId(sessionEmail);

  try {
    const body = (await request.json()) as {
      packId?: string;
      currency?: string;
    };

    if (!body.packId || !isAiCreditPackId(body.packId)) {
      return NextResponse.json({ error: "Invalid credit pack." }, { status: 400 });
    }

    if (!body.currency || !isBillingCurrency(body.currency)) {
      return NextResponse.json(
        { error: "Invalid or missing currency." },
        { status: 400 }
      );
    }

    if (!RAZORPAY_CONNECTED || !isCheckoutAvailableServer(body.currency)) {
      return NextResponse.json(
        { error: "Checkout is not configured." },
        { status: 503 }
      );
    }

    const pack = getAiCreditPack(body.packId)!;
    const amount = getAiCreditPackAmount(pack.id, body.currency);
    if (!amount) {
      return NextResponse.json(
        { error: "Unable to price this credit pack." },
        { status: 400 }
      );
    }

    const order = await createRazorpayCreditTopUpOrder({
      userId,
      email: sessionEmail,
      packId: pack.id,
      credits: pack.credits,
      amount,
      currency: body.currency,
    });

    await createPendingCreditPurchase({
      userId,
      packId: pack.id,
      credits: pack.credits,
      amount: order.amount,
      currency: body.currency,
      razorpayOrderId: order.orderId,
    });

    return NextResponse.json({
      provider: "razorpay",
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      keyId: order.keyId,
      description: order.description,
      packId: pack.id,
      credits: pack.credits,
      packName: pack.name,
    });
  } catch (error) {
    console.error("[ai-credits/checkout] create failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to start credit checkout.",
      },
      { status: 500 }
    );
  }
}
