import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateEmailReplyWithRetry, isReplyTone } from "@/lib/openai";
import { canUseAiAction, subscriptionProvider } from "@/lib/subscription";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;

  if (!userId) {
    return NextResponse.json(
      { error: "Not authenticated." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { sender, subject, emailBody, threadContext, tone } = body;

    if (!sender || !subject || !emailBody) {
      return NextResponse.json(
        { error: "sender, subject, and emailBody are required." },
        { status: 400 }
      );
    }

    const replyTone = tone && isReplyTone(tone) ? tone : "professional";

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

    const reply = await generateEmailReplyWithRetry({
      sender,
      subject,
      body: emailBody,
      threadContext:
        typeof threadContext === "string" ? threadContext : undefined,
      tone: replyTone,
    });

    const updated = await subscriptionProvider.recordAiAction(userId);

    return NextResponse.json({
      reply,
      tone: replyTone,
      usage: updated.usage,
    });
  } catch (error) {
    console.error("[ai-reply] Failed to generate reply:", error);

    const message =
      error instanceof Error ? error.message : "Failed to generate AI reply";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
