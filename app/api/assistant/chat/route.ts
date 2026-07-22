import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { streamAssistantChat, type ChatMessage } from "@/lib/assistant/chat";
import { requireAiCreditsResponse } from "@/lib/ai-credits/require";
import { getServerSession } from "next-auth";

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

    const creditGate = await requireAiCreditsResponse(userId, "roxx_chat", {
      regenerate: Boolean(body.regenerate),
    });
    if (!creditGate.ok) return creditGate.response;

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
                : "Roxx AI failed to respond.",
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
          error instanceof Error ? error.message : "Failed to start chat.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
