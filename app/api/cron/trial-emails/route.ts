import { NextRequest, NextResponse } from "next/server";
import { logApiError } from "@/lib/api/log-error";
import { processTrialEmailAutomation } from "@/lib/trial/email";

export const maxDuration = 60;

/**
 * Vercel Cron / manual trigger for trial lifecycle emails + expiry.
 * Secured with CRON_SECRET (Authorization: Bearer <secret>).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await processTrialEmailAutomation();
    console.log("[cron/trial-emails]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    logApiError("cron/trial-emails", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Trial email automation failed.",
      },
      { status: 500 }
    );
  }
}
