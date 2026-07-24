import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAiCredits } from "@/lib/ai-credits/require";
import { refundAiCredits } from "@/lib/ai-credits/consume";
import { generateEmailInsightsWithRetry } from "@/lib/openai";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionEmail = session?.user?.email;

  if (!sessionEmail) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = normalizeSubscriptionUserId(sessionEmail);

  try {
    const body = await request.json();
    const { sender, subject, emailBody, threadContext } = body;

    if (!sender || !subject || !emailBody) {
      return NextResponse.json(
        { error: "sender, subject, and emailBody are required." },
        { status: 400 }
      );
    }

    const creditGate = await requireAiCredits(userId, "email_insights");
    if ("error" in creditGate && creditGate.error) return creditGate.error;

    try {
      const insights = await generateEmailInsightsWithRetry({
        sender,
        subject,
        body: emailBody,
        threadContext:
          typeof threadContext === "string" ? threadContext : undefined,
      });

      const consumed = creditGate.consumed!;

      return NextResponse.json({
        insights,
        usage: {
          aiActionsUsed: consumed.usage.aiActionsUsed,
          aiRepliesCount: consumed.usage.aiRepliesCount,
          aiCreditsRemaining: consumed.remaining,
          aiCreditsAllotment: consumed.allotment,
        },
      });
    } catch (inner) {
      await refundAiCredits(userId, 1, {
        feature: "email_insights",
        reason: "insights_generation_failed",
      });
      throw inner;
    }
  } catch (error) {
    console.error("[ai-insights] Failed:", error);
    return NextResponse.json(
      { error: "Failed to generate insights. Please try again." },
      { status: 500 }
    );
  }
}
