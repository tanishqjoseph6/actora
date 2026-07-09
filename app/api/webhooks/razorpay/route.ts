import { NextRequest, NextResponse } from "next/server";
import {
  handleRazorpayWebhook,
  type RazorpayWebhookPayload,
} from "@/lib/billing/razorpay-webhook";
import { verifyRazorpayWebhookSignature } from "@/lib/billing/razorpay";
import { logApiError } from "@/lib/api/log-error";
import { isSupabaseConfigured } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    console.error(
      "[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET is not configured"
    );
    return NextResponse.json(
      { error: "Webhook secret is not configured." },
      { status: 503 }
    );
  }

  if (!isSupabaseConfigured()) {
    console.error(
      "[razorpay-webhook] Supabase service role is not configured — cannot persist subscription"
    );
    return NextResponse.json(
      { error: "Database is not configured for subscription writes." },
      { status: 503 }
    );
  }

  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing webhook signature." },
        { status: 400 }
      );
    }

    if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
      console.warn("[razorpay-webhook] Invalid signature");
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody) as RazorpayWebhookPayload;

    console.log("[razorpay-webhook] request payload", {
      event: payload.event,
      subscriptionId: payload.payload?.subscription?.entity?.id,
      subscriptionStatus: payload.payload?.subscription?.entity?.status,
      subscriptionPlanId: payload.payload?.subscription?.entity?.plan_id,
      subscriptionNotes: payload.payload?.subscription?.entity?.notes,
      paymentId: payload.payload?.payment?.entity?.id,
      paymentSubscriptionId: payload.payload?.payment?.entity?.subscription_id,
      paymentNotes: payload.payload?.payment?.entity?.notes,
    });

    const result = await handleRazorpayWebhook(payload);

    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    logApiError("razorpay-webhook", error, {
      usesServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Webhook processing failed.",
      },
      { status: 500 }
    );
  }
}
