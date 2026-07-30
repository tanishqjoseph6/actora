import { NextRequest, NextResponse } from "next/server";
import { processOnboardingEmailAutomation } from "@/lib/growth/onboarding-emails";
import { logApiError } from "@/lib/api/log-error";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await processOnboardingEmailAutomation();
    console.log("[cron/onboarding-emails]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    logApiError("cron/onboarding-emails", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Onboarding email automation failed.",
      },
      { status: 500 }
    );
  }
}
