import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { RAZORPAY_CONNECTED } from "@/lib/billing/config";
import type { PlanId } from "@/lib/subscription";
import {
  subscriptionProvider,
  toSubscriptionSnapshot,
} from "@/lib/subscription";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  return email ? normalizeSubscriptionUserId(email) : null;
}

export async function GET() {
  const userId = await getUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Not authenticated." },
      { status: 401 }
    );
  }

  const subscription = await subscriptionProvider.getSubscription(userId);

  return NextResponse.json({
    subscription: toSubscriptionSnapshot(subscription),
  });
}

export async function PATCH(request: NextRequest) {
  const userId = await getUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Not authenticated." },
      { status: 401 }
    );
  }

  // Dev mock upgrades only — production plan changes go through Razorpay webhooks.
  if (process.env.NODE_ENV === "production" && RAZORPAY_CONNECTED) {
    return NextResponse.json(
      { error: "Plan changes must go through billing checkout." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { planId, billingInterval } = body as {
      planId?: PlanId;
      billingInterval?: "monthly" | "yearly";
    };

    const validPlans: PlanId[] = ["free", "starter", "pro", "enterprise"];
    if (!planId || !validPlans.includes(planId)) {
      return NextResponse.json(
        { error: "Invalid planId." },
        { status: 400 }
      );
    }

    const updated = await subscriptionProvider.setPlan(
      userId,
      planId,
      billingInterval ?? "monthly"
    );

    return NextResponse.json({
      subscription: toSubscriptionSnapshot(updated),
    });
  } catch (error) {
    console.error("[subscription] Failed to update plan:", error);
    return NextResponse.json(
      { error: "Failed to update subscription." },
      { status: 500 }
    );
  }
}
