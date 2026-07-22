import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAiCredits } from "@/lib/ai-credits/require";
import { generateEmailSummaryWithRetry } from "@/lib/openai";

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

    const creditGate = await requireAiCredits(userId, "email_summary");
    if ("error" in creditGate && creditGate.error) return creditGate.error;

    const summary = await generateEmailSummaryWithRetry({
      sender,
      subject,
      body: emailBody,
      threadContext:
        typeof threadContext === "string" ? threadContext : undefined,
    });

    const consumed = creditGate.consumed!;

    return NextResponse.json({
      summary,
      usage: {
        aiActionsUsed: consumed.usage.aiActionsUsed,
        aiRepliesCount: consumed.usage.aiRepliesCount,
        aiCreditsRemaining: consumed.remaining,
        aiCreditsAllotment: consumed.allotment,
      },
    });
  } catch (error) {
    console.error("[ai-summary] Failed to generate summary:", error);

    const message =
      error instanceof Error ? error.message : "Failed to generate AI summary";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
