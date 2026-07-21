import OpenAI from "openai";
import {
  buildWorkspaceContext,
} from "@/lib/assistant/context";
import {
  ASSISTANT_TOOLS,
  executeAssistantTool,
} from "@/lib/assistant/tools";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured.");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export function buildAssistantSystemPrompt(summaryText: string): string {
  return `You are Roxx — Actora's AI teammate and ChatGPT-style copilot inside the Actora workspace.
You help the user with their inbox, CRM, calendar, tasks, and automations.

Rules:
- Be concise, professional, and action-oriented.
- Use tools when you need live data or to create/update records.
- After using tools, explain what you did clearly.
- When drafting email replies, present the full draft clearly.
- Prefer actionable next steps.
- If Gmail/Calendar aren't connected, say so and still help with CRM/tasks when possible.
- Never invent CRM IDs or claim actions succeeded unless a tool returned ok:true.
- Do not mention internal tool names unless the user asks.

Workspace context:
${summaryText}`;
}

export type AssistantStreamEvent =
  | { type: "token"; text: string }
  | { type: "tool_start"; name: string }
  | { type: "tool_result"; name: string; result: Record<string, unknown> }
  | { type: "done"; content: string }
  | { type: "error"; message: string };

/**
 * Tool-calling loop, then stream the final natural-language answer.
 */
export async function* streamAssistantChat(
  userId: string,
  messages: ChatMessage[]
): AsyncGenerator<AssistantStreamEvent> {
  const openai = getOpenAIClient();
  const context = await buildWorkspaceContext(userId);

  const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: buildAssistantSystemPrompt(context.summaryText) },
    ...messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-16)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
  ];

  for (let round = 0; round < 4; round++) {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      temperature: 0.4,
      messages: openaiMessages,
      tools: ASSISTANT_TOOLS,
      tool_choice: "auto",
    });

    const choice = completion.choices[0]?.message;
    if (!choice) {
      yield { type: "error", message: "Empty model response." };
      return;
    }

    const toolCalls = choice.tool_calls;
    if (!toolCalls?.length) {
      const content = choice.content?.trim() ?? "";
      if (content) {
        const chunkSize = 28;
        for (let i = 0; i < content.length; i += chunkSize) {
          yield { type: "token", text: content.slice(i, i + chunkSize) };
          await new Promise((r) => setTimeout(r, 6));
        }
        yield { type: "done", content };
        return;
      }
      break;
    }

    openaiMessages.push({
      role: "assistant",
      content: choice.content,
      tool_calls: toolCalls,
    });

    for (const call of toolCalls) {
      if (call.type !== "function") continue;
      const fn = call.function;
      yield { type: "tool_start", name: fn.name };
      const result = await executeAssistantTool(
        userId,
        fn.name,
        fn.arguments,
        context
      );
      yield { type: "tool_result", name: fn.name, result };
      openaiMessages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  const stream = await openai.chat.completions.create({
    model: "gpt-5-mini",
    temperature: 0.4,
    messages: openaiMessages,
    stream: true,
  });

  let full = "";
  for await (const part of stream) {
    const text = part.choices[0]?.delta?.content ?? "";
    if (text) {
      full += text;
      yield { type: "token", text };
    }
  }
  yield { type: "done", content: full };
}
