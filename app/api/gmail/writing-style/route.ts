import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { getGmailAuthClient } from "@/lib/gmail-auth";
import {
  fetchSentEmailSamples,
  getWritingStyleStatus,
  learnWritingStyleFromSamples,
  setWritingStyleEnabled,
} from "@/lib/email-reply";
import { hasPlanFeature, subscriptionProvider } from "@/lib/subscription";
import type { PlanId } from "@/lib/subscription";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

/**
 * Public status only — never returns the learned style profile contents.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = normalizeSubscriptionUserId(email);
  const subscription = await subscriptionProvider.getSubscription(userId);
  const planId = (subscription.planId ?? "free") as PlanId;
  const allowed = hasPlanFeature(planId, "sound_like_me");
  const status = await getWritingStyleStatus(userId);

  return NextResponse.json({
    allowed,
    ...status,
    // Never include profile
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = normalizeSubscriptionUserId(email);
  const subscription = await subscriptionProvider.getSubscription(userId);
  const planId = (subscription.planId ?? "free") as PlanId;

  if (!hasPlanFeature(planId, "sound_like_me")) {
    return NextResponse.json(
      {
        error: "Sound Like Me requires Pro or Team.",
        code: "PLAN_LIMIT",
        limitType: "feature",
        recommendedPlan: "pro",
        feature: "sound_like_me",
      },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as {
      action?: "enable" | "disable" | "learn";
      enabled?: boolean;
    };

    if (body.action === "enable" || body.action === "disable" || typeof body.enabled === "boolean") {
      const enabled =
        body.action === "enable"
          ? true
          : body.action === "disable"
            ? false
            : Boolean(body.enabled);
      const status = await setWritingStyleEnabled(userId, enabled);
      return NextResponse.json({ allowed: true, ...status });
    }

    if (body.action === "learn") {
      const auth = await getGmailAuthClient(request);
      if (!auth.ok) {
        return NextResponse.json(
          { error: auth.error, code: auth.code },
          { status: auth.status }
        );
      }

      const samples = await fetchSentEmailSamples(auth, 12);
      const status = await learnWritingStyleFromSamples(userId, samples);
      // Auto-enable after successful learn
      const enabledStatus = await setWritingStyleEnabled(userId, true);
      return NextResponse.json({
        allowed: true,
        ...enabledStatus,
        sampleCount: status.sampleCount,
        learned: true,
      });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.error("[writing-style]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update writing style.",
      },
      { status: 500 }
    );
  }
}
