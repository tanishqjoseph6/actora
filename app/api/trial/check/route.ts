import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { logApiError } from "@/lib/api/log-error";
import { getTrialStatus } from "@/lib/trial/service";
import { getStoredSubscription } from "@/lib/subscription/repository";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

/**
 * Server-side trial validation. Forces expiry check and returns current access state.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = normalizeSubscriptionUserId(email);

  try {
    // Force a fresh read (repository lazily expires trials).
    await getStoredSubscription(userId);
    const status = await getTrialStatus(userId);

    return NextResponse.json({
      valid: status.subscription.hasProductAccess,
      trialActive: status.trial.trialActive,
      trialExpired: status.trial.trialExpired,
      remainingDays: status.trial.remainingDays,
      remainingHours: status.trial.remainingHours,
      planId: status.subscription.planId,
      subscription: status.subscription,
      trial: status.trial,
    });
  } catch (error) {
    logApiError("api/trial/check", error, { userId });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to check trial.",
      },
      { status: 500 }
    );
  }
}
