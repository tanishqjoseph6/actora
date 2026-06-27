import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "@/lib/billing/razorpay";
import { syncSubscriptionFromWebhook } from "@/lib/subscription";

export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    await syncSubscriptionFromWebhook(payload);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[razorpay-webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
