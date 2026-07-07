import { NextRequest, NextResponse } from "next/server";
import {
  handleRazorpayWebhook,
  type RazorpayWebhookPayload,
} from "@/lib/billing/razorpay-webhook";
import { verifyRazorpayWebhookSignature } from "@/lib/billing/razorpay";

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
    const result = await handleRazorpayWebhook(payload);

    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    console.error("[razorpay-webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
