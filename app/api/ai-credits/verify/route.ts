import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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
import {
  logWorkspaceActivity,
  requireWorkspacePermission,
} from "@/lib/workspace";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sendCreditPurchaseConfirmationEmail } from "@/lib/email/billing-emails";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionEmail = session?.user?.email;
  if (!sessionEmail) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const actorId = normalizeSubscriptionUserId(sessionEmail);

  const wsAuth = await requireWorkspacePermission("credits", request);
  const creditOwnerId = wsAuth.ok
    ? wsAuth.ctx.workspace.owner_user_id
    : actorId;
  const workspaceId = wsAuth.ok ? wsAuth.ctx.workspaceId : null;

  if (wsAuth.ok && wsAuth.ctx.role !== "owner" && wsAuth.ctx.role !== "admin") {
    return NextResponse.json(
      { error: "Only owners and admins can purchase credits.", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

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
      const subscription = await subscriptionProvider.getSubscription(creditOwnerId);
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

    if (pending.userId !== creditOwnerId && pending.userId !== actorId) {
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
      userId: pending.userId,
    });

    if (!paid || paid.status !== "paid") {
      return NextResponse.json(
        { error: "Unable to finalize purchase." },
        { status: 500 }
      );
    }

    if (!alreadyPaid) {
      await addPurchasedCreditsBalance(pending.userId, paid.credits);
    }

    if (workspaceId) {
      try {
        await logWorkspaceActivity({
          workspaceId,
          actorUserId: actorId,
          action: "credits.purchased",
          metadata: {
            credits: paid.credits,
            packId: paid.packId,
            amount: paid.amount,
            currency: paid.currency,
          },
        });
      } catch (err) {
        console.error("[ai-credits/verify] activity log failed:", err);
      }

      const db = getSupabaseAdmin();
      if (db) {
        await db
          .from("ai_credit_purchases")
          .update({ workspace_id: workspaceId })
          .eq("id", paid.id);
      }
    }

    const subscription = await subscriptionProvider.getSubscription(pending.userId);

    const amountLabel =
      paid.currency === "USD"
        ? `$${(paid.amount / 100).toFixed(2)}`
        : `₹${Math.round(paid.amount / 100).toLocaleString("en-IN")}`;

    void sendCreditPurchaseConfirmationEmail({
      to: sessionEmail,
      packName: pack.name,
      credits: paid.credits,
      amountLabel,
    }).catch((err) => {
      console.error("[ai-credits/verify] credit purchase email failed:", err);
    });

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
