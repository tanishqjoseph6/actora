import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAiCredits } from "@/lib/ai-credits/require";
import { generateEmailReplyWithRetry, isReplyTone } from "@/lib/openai";
import { subscriptionProvider } from "@/lib/subscription";

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

    const creditGate = await requireAiCredits(userId, "email_reply", {
      subject: typeof subject === "string" ? subject.slice(0, 120) : undefined,
    });
    if ("error" in creditGate && creditGate.error) return creditGate.error;

    const reply = await generateEmailReplyWithRetry({
      sender,
      subject,
      body: emailBody,
      threadContext:
        typeof threadContext === "string" ? threadContext : undefined,
      tone: replyTone,
    });

    const refreshed = await subscriptionProvider.getSubscription(userId);
    const consumed = creditGate.consumed!;

    return NextResponse.json({
      reply,
      tone: replyTone,
      usage: {
        aiActionsUsed: consumed.usage.aiActionsUsed,
        aiRepliesCount: consumed.usage.aiRepliesCount,
        aiCreditsRemaining: consumed.remaining,
        aiCreditsAllotment: consumed.allotment,
        inboxesConnected: refreshed.usage.inboxesConnected,
      },
    });
  } catch (error) {
    console.error("[ai-reply] Failed to generate reply:", error);

    const message =
      error instanceof Error ? error.message : "Failed to generate AI reply";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
