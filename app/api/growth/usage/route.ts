import { NextRequest, NextResponse } from "next/server";
import {
  getApiUserEmail,
  unauthenticatedJsonResponse,
} from "@/lib/auth/get-api-user";
import {
  getGrowthPreferences,
  listGrowthMetrics,
  updateGrowthPreferences,
} from "@/lib/growth/repository";

export async function GET(request: NextRequest) {
  const email = await getApiUserEmail(request);
  if (!email) return unauthenticatedJsonResponse();

  try {
    const period = request.nextUrl.searchParams.get("period") ?? "30d";
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const [prefs, metrics] = await Promise.all([
      getGrowthPreferences(email),
      listGrowthMetrics(email, days),
    ]);

    const totals = metrics.reduce(
      (acc, day) => ({
        tasksCompleted: acc.tasksCompleted + day.tasksCompleted,
        meetingsSummarized: acc.meetingsSummarized + day.meetingsSummarized,
        aiPrompts: acc.aiPrompts + day.aiPrompts,
        crmUpdates: acc.crmUpdates + day.crmUpdates,
        documentsCreated: acc.documentsCreated + day.documentsCreated,
        automationRuns: acc.automationRuns + day.automationRuns,
      }),
      {
        tasksCompleted: 0,
        meetingsSummarized: 0,
        aiPrompts: 0,
        crmUpdates: 0,
        documentsCreated: 0,
        automationRuns: 0,
      }
    );

    return NextResponse.json({ preferences: prefs, metrics, totals, period });
  } catch (error) {
    console.error("[api/growth/usage GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load usage." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const email = await getApiUserEmail(request);
  if (!email) return unauthenticatedJsonResponse();

  try {
    const body = (await request.json()) as Record<string, boolean>;
    const preferences = await updateGrowthPreferences(email, {
      emailOnboarding: body.emailOnboarding,
      emailProductUpdates: body.emailProductUpdates,
      emailWeeklyDigest: body.emailWeeklyDigest,
      emailReferralRewards: body.emailReferralRewards,
      notifyReferrals: body.notifyReferrals,
      notifyInvites: body.notifyInvites,
      notifyAutomations: body.notifyAutomations,
      notifyAiSummary: body.notifyAiSummary,
      notifyProductUpdates: body.notifyProductUpdates,
    });
    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("[api/growth/usage PATCH]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save preferences." },
      { status: 500 }
    );
  }
}
