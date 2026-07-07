import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import {
  canAccessFeature,
  subscriptionProvider,
  type PlanFeature,
} from "@/lib/subscription";

export async function requirePlanFeature(feature: PlanFeature) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;

  if (!userId) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Not authenticated." }, { status: 401 }),
    };
  }

  const subscription = await subscriptionProvider.getSubscription(userId);
  const gate = canAccessFeature(subscription.planId, feature);

  if (!gate.allowed) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error: gate.reason,
          code: "PLAN_LIMIT",
          limitType: gate.limitType,
          feature: gate.feature,
          recommendedPlan: gate.recommendedPlan,
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, userId, subscription };
}
