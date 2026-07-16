import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { cancelRazorpaySubscription } from "@/lib/billing/razorpay";
import { logApiError } from "@/lib/api/log-error";
import {
  cancelStoredSubscription,
  getStoredSubscription,
} from "@/lib/subscription/repository";
import { isPaidPlanId } from "@/lib/trial/helpers";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

export async function POST() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = normalizeSubscriptionUserId(email);

  try {
    const existing = await getStoredSubscription(userId);

    if (!isPaidPlanId(existing.planId)) {
      return NextResponse.json(
        { error: "No active paid subscription to cancel." },
        { status: 400 }
      );
    }

    if (existing.status === "canceled") {
      return NextResponse.json({
        success: true,
        message: "Subscription is already scheduled to cancel.",
        currentPeriodEnd: existing.currentPeriodEnd,
      });
    }

    if (existing.razorpaySubscriptionId) {
      await cancelRazorpaySubscription(existing.razorpaySubscriptionId);
    }

    const updated = await cancelStoredSubscription(userId);

    return NextResponse.json({
      success: true,
      message:
        "Your subscription will cancel at the end of the current billing period.",
      currentPeriodEnd: updated.currentPeriodEnd,
      status: updated.status,
    });
  } catch (error) {
    logApiError("billing/cancel", error, { userId });
    const message =
      error instanceof Error ? error.message : "Failed to cancel subscription.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
