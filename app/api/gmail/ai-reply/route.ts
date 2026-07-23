import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAiCredits } from "@/lib/ai-credits/require";
import {
  generateReplySuggestions,
  getWritingStyleProfileInternal,
  isReplyLength,
  normalizeLegacyTone,
  streamEmailReply,
  type ReplyLength,
  type ReplyTone,
} from "@/lib/email-reply";
import { hasPlanFeature, subscriptionProvider } from "@/lib/subscription";
import type { PlanId } from "@/lib/subscription";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionEmail = session?.user?.email;

  if (!sessionEmail) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = normalizeSubscriptionUserId(sessionEmail);

  try {
    const body = (await request.json()) as {
      sender?: string;
      subject?: string;
      emailBody?: string;
      threadContext?: string;
      tone?: string;
      length?: string;
      customToneHint?: string;
      soundLikeMe?: boolean;
      stream?: boolean;
      variants?: number;
    };

    const { sender, subject, emailBody, threadContext } = body;

    if (!sender || !subject || !emailBody) {
      return NextResponse.json(
        { error: "sender, subject, and emailBody are required." },
        { status: 400 }
      );
    }

    const legacy = normalizeLegacyTone(body.tone);
    const tone: ReplyTone = legacy.tone;
    const length: ReplyLength = isReplyLength(body.length)
      ? body.length
      : legacy.length ?? "medium";

    const subscription = await subscriptionProvider.getSubscription(userId);
    const planId = (subscription.planId ?? "free") as PlanId;

    let soundLikeMe = Boolean(body.soundLikeMe);
    let styleProfile:
      | import("@/lib/email-reply").WritingStyleProfileData
      | null = null;

    if (soundLikeMe) {
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

      const style = await getWritingStyleProfileInternal(userId);
      if (!style?.enabled || !style.profile) {
        return NextResponse.json(
          {
            error:
              "Sound Like Me is off or not trained yet. Enable it and learn from your sent emails first.",
            code: "STYLE_NOT_READY",
          },
          { status: 400 }
        );
      }
      styleProfile = style.profile;
    } else {
      soundLikeMe = false;
    }

    const creditGate = await requireAiCredits(userId, "email_reply", {
      subject: typeof subject === "string" ? subject.slice(0, 120) : undefined,
      soundLikeMe,
      tone,
      length,
    });
    if ("error" in creditGate && creditGate.error) return creditGate.error;

    const generateInput = {
      sender,
      subject,
      body: emailBody,
      threadContext:
        typeof threadContext === "string" ? threadContext : undefined,
      tone,
      length,
      customToneHint:
        typeof body.customToneHint === "string"
          ? body.customToneHint
          : undefined,
      soundLikeMe,
      styleProfile,
    };

    const wantVariants = Number(body.variants) === 3;
    const wantStream = body.stream !== false && !wantVariants;

    if (wantVariants) {
      const suggestions = await generateReplySuggestions(generateInput);
      const refreshed = await subscriptionProvider.getSubscription(userId);
      const consumed = creditGate.consumed!;

      return NextResponse.json({
        suggestions,
        reply: suggestions[0] ?? "",
        tone,
        length,
        soundLikeMe,
        usage: {
          aiActionsUsed: consumed.usage.aiActionsUsed,
          aiRepliesCount: consumed.usage.aiRepliesCount,
          aiCreditsRemaining: consumed.remaining,
          aiCreditsAllotment: consumed.allotment,
          inboxesConnected: refreshed.usage.inboxesConnected,
        },
      });
    }

    if (wantStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const send = (event: unknown) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
            );
          };
          try {
            let full = "";
            for await (const text of streamEmailReply(generateInput)) {
              full += text;
              send({ type: "token", text });
            }
            const refreshed = await subscriptionProvider.getSubscription(userId);
            const consumed = creditGate.consumed!;
            send({
              type: "done",
              reply: full,
              tone,
              length,
              soundLikeMe,
              usage: {
                aiActionsUsed: consumed.usage.aiActionsUsed,
                aiRepliesCount: consumed.usage.aiRepliesCount,
                aiCreditsRemaining: consumed.remaining,
                aiCreditsAllotment: consumed.allotment,
                inboxesConnected: refreshed.usage.inboxesConnected,
              },
            });
          } catch (error) {
            send({
              type: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to generate AI reply",
            });
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    // Non-stream fallback
    const { generateEmailReplyWithRetry } = await import("@/lib/email-reply");
    const reply = await generateEmailReplyWithRetry(generateInput);
    const refreshed = await subscriptionProvider.getSubscription(userId);
    const consumed = creditGate.consumed!;

    return NextResponse.json({
      reply,
      tone,
      length,
      soundLikeMe,
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
