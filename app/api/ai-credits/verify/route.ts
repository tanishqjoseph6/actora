import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { verifyRazorpayPaymentSignature } from "@/lib/billing/razorpay";
import {
  addPurchasedCreditsBalance,
  findCreditPurchaseByOrderId,
  findCreditPurchaseByPaymentId,
  markCreditPurchasePaid,
} from "@/lib/ai-credits/purchases";
import { getAiCreditPack } from "@/lib/ai-credits/packs";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import { subscriptionProvider, toSubscriptionSnapshot } from "@/lib/subscription";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionEmail = session?.user?.email;
  if (!sessionEmail) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = normalizeSubscriptionUserId(sessionEmail);

  try {
    const body = (await request.json()) as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      packId?: string;
    };

    const orderId = body.razorpay_order_id?.trim();
    const paymentId = body.razorpay_payment_id?.trim();
    const signature = body.razorpay_signature?.trim();

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: "Missing payment verification fields." },
        { status: 400 }
      );
    }

    const valid = verifyRazorpayPaymentSignature({
      orderId,
      paymentId,
      signature,
    });
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid payment signature." },
        { status: 400 }
      );
    }

    const alreadyPaid = await findCreditPurchaseByPaymentId(paymentId);
    if (alreadyPaid?.status === "paid") {
      const subscription = await subscriptionProvider.getSubscription(userId);
      return NextResponse.json({
        ok: true,
        alreadyProcessed: true,
        purchase: alreadyPaid,
        subscription: toSubscriptionSnapshot(subscription),
      });
    }

    const pending = await findCreditPurchaseByOrderId(orderId);
    if (!pending) {
      return NextResponse.json(
        { error: "Purchase order not found." },
        { status: 404 }
      );
    }

    if (pending.userId !== userId) {
      return NextResponse.json({ error: "Purchase mismatch." }, { status: 403 });
    }

    if (body.packId && body.packId !== pending.packId) {
      return NextResponse.json(
        { error: "Pack does not match checkout order." },
        { status: 400 }
      );
    }

    const pack = getAiCreditPack(pending.packId);
    if (!pack || pack.credits !== pending.credits) {
      return NextResponse.json(
        { error: "Invalid credit pack on order." },
        { status: 400 }
      );
    }

    const paid = await markCreditPurchasePaid({
      orderId,
      paymentId,
      userId,
    });

    if (!paid || paid.status !== "paid") {
      return NextResponse.json(
        { error: "Unable to finalize purchase." },
        { status: 500 }
      );
    }

    // Grant credits only once (idempotent via payment id uniqueness)
    if (!alreadyPaid) {
      await addPurchasedCreditsBalance(userId, paid.credits);
    }

    const subscription = await subscriptionProvider.getSubscription(userId);

    return NextResponse.json({
      ok: true,
      purchase: paid,
      creditsAdded: paid.credits,
      packName: pack.name,
      subscription: toSubscriptionSnapshot(subscription),
    });
  } catch (error) {
    console.error("[ai-credits/verify] failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to verify credit purchase.",
      },
      { status: 500 }
    );
  }
}
