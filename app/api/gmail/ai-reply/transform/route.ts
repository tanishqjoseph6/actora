import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAiCredits } from "@/lib/ai-credits/require";
import {
  isReplyAction,
  transformEmailReply,
} from "@/lib/email-reply";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionEmail = session?.user?.email;
  if (!sessionEmail) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = normalizeSubscriptionUserId(sessionEmail);

  try {
    const body = (await request.json()) as {
      draft?: string;
      action?: string;
      translateTo?: string;
    };

    if (!body.draft?.trim()) {
      return NextResponse.json({ error: "draft is required." }, { status: 400 });
    }
    if (!isReplyAction(body.action)) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    const creditGate = await requireAiCredits(userId, "email_reply", {
      action: body.action,
    });
    if ("error" in creditGate && creditGate.error) return creditGate.error;

    const reply = await transformEmailReply({
      draft: body.draft,
      action: body.action,
      translateTo:
        typeof body.translateTo === "string" ? body.translateTo : undefined,
    });

    return NextResponse.json({
      reply,
      action: body.action,
      usage: {
        aiCreditsRemaining: creditGate.consumed!.remaining,
        aiCreditsAllotment: creditGate.consumed!.allotment,
      },
    });
  } catch (error) {
    console.error("[ai-reply/transform]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to transform reply.",
      },
      { status: 500 }
    );
  }
}
