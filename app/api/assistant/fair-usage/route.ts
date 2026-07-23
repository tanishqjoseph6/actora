import { authOptions } from "@/lib/auth/auth-options";
import { getRoxxFairUsageStatus } from "@/lib/assistant/fair-usage";
import { subscriptionProvider } from "@/lib/subscription";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import type { PlanId } from "@/lib/subscription";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = normalizeSubscriptionUserId(email);
  const subscription = await subscriptionProvider.getSubscription(userId);
  const planId = (subscription.planId ?? "free") as PlanId;
  const status = await getRoxxFairUsageStatus(userId, planId);

  return NextResponse.json(status);
}
