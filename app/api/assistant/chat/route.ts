import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { streamAssistantChat, type ChatMessage } from "@/lib/assistant/chat";
import { recordAiAction } from "@/lib/dashboard/user-usage";
import { canUseAiAction, subscriptionProvider } from "@/lib/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;
  if (!userId) {
    return new Response(JSON.stringify({ error: "Not authenticated." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await request.json()) as {
      messages?: ChatMessage[];
      regenerate?: boolean;
    };

    const messages = (body.messages ?? []).filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim()
    );

    if (!messages.length || messages[messages.length - 1]?.role !== "user") {
      return new Response(
        JSON.stringify({ error: "Send at least one user message." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const subscription = await subscriptionProvider.getSubscription(userId);
    const gate = canUseAiAction(subscription.planId, subscription.usage);
    if (!gate.allowed) {
      return new Response(
        JSON.stringify({
          error: gate.reason,
          code: "PLAN_LIMIT",
          limitType: gate.limitType,
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    await recordAiAction(userId);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: unknown) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        };
        try {
          for await (const event of streamAssistantChat(userId, messages)) {
            send(event);
          }
        } catch (error) {
          send({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "Roxx failed to respond.",
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
  } catch (error) {
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Roxx request failed.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
