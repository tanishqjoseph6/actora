import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { logApiError } from "@/lib/api/log-error";
import { ensureTrialStarted } from "@/lib/trial/service";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

export async function POST() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = normalizeSubscriptionUserId(email);

  try {
    const result = await ensureTrialStarted(userId);

    if (result.reason === "trial_already_used" && !result.trial.trialActive) {
      return NextResponse.json(
        {
          error: "A free trial has already been used on this account.",
          code: "TRIAL_ALREADY_USED",
          ...result,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logApiError("api/trial/start", error, { userId });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to start trial.",
      },
      { status: 500 }
    );
  }
}
