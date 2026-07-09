import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { logApiError } from "@/lib/api/log-error";
import { RAZORPAY_CONNECTED } from "@/lib/billing/config";
import type { PlanId } from "@/lib/subscription";
import {
  subscriptionProvider,
  toSubscriptionSnapshot,
} from "@/lib/subscription";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import { isSupabaseConfigured } from "@/lib/supabase-admin";

export const maxDuration = 60;

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

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Subscription database is not configured. Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
        code: "CONFIG_ERROR",
      },
      { status: 503 }
    );
  }

  try {
    const subscription = await subscriptionProvider.getSubscription(userId);

    return NextResponse.json({
      subscription: toSubscriptionSnapshot(subscription),
    });
  } catch (error) {
    logApiError("api/subscription", error, { userId, method: "GET" });

    const message =
      error instanceof Error
        ? error.message
        : "Failed to load subscription.";

    return NextResponse.json({ error: message }, { status: 503 });
  }
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
    logApiError("api/subscription", error, { userId, method: "PATCH" });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update subscription.",
      },
      { status: 500 }
    );
  }
}
