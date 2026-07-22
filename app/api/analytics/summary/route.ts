import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsSnapshot } from "@/lib/analytics/aggregator";
import type { AnalyticsPeriod } from "@/lib/analytics/types";
import {
  getApiUserEmail,
  unauthenticatedJsonResponse,
} from "@/lib/auth/get-api-user";
import { canAccessFeature, subscriptionProvider } from "@/lib/subscription";

export const dynamic = "force-dynamic";

const VALID_PERIODS = new Set<AnalyticsPeriod>(["7d", "30d", "90d", "12m"]);

export async function GET(request: NextRequest) {
  const userId = await getApiUserEmail(request);
  if (!userId) {
    return unauthenticatedJsonResponse();
  }

  const subscription = await subscriptionProvider.getSubscription(userId);
  const gate = canAccessFeature(subscription.planId, "analytics");
  if (!gate.allowed) {
    return NextResponse.json(
      {
        error: gate.reason,
        code: "PLAN_LIMIT",
        limitType: gate.limitType,
      },
      { status: 403 }
    );
  }

  const periodParam = request.nextUrl.searchParams.get("period") ?? "7d";
  const period = VALID_PERIODS.has(periodParam as AnalyticsPeriod)
    ? (periodParam as AnalyticsPeriod)
    : "7d";

  try {
    const snapshot = await getAnalyticsSnapshot(userId, period);
    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[api/analytics/summary]", error);
    return NextResponse.json(
      { error: "Could not load analytics." },
      { status: 500 }
    );
  }
}
