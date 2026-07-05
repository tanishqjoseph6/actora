import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { recordAiAction } from "@/lib/dashboard/user-usage";
import {
  generateEmailSummaryWithRetry,
} from "@/lib/openai";
import { canUseAiAction, subscriptionProvider } from "@/lib/subscription";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { sender, subject, emailBody, threadContext } = body;

    if (!sender || !subject || !emailBody) {
      return NextResponse.json(
        { error: "sender, subject, and emailBody are required." },
        { status: 400 }
      );
    }

    const subscription = await subscriptionProvider.getSubscription(userId);
    const gate = canUseAiAction(subscription.planId, subscription.usage);

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

    const summary = await generateEmailSummaryWithRetry({
      sender,
      subject,
      body: emailBody,
      threadContext:
        typeof threadContext === "string" ? threadContext : undefined,
    });

    const usage = await recordAiAction(userId);

    return NextResponse.json({
      summary,
      usage: {
        aiActionsUsed: usage.aiActionsUsed,
        aiRepliesCount: usage.aiRepliesCount,
      },
    });
  } catch (error) {
    console.error("[ai-summary] Failed to generate summary:", error);

    const message =
      error instanceof Error ? error.message : "Failed to generate AI summary";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
