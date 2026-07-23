import OpenAI from "openai";
import { resolveOpenAiApiKey } from "@/lib/openai/api-key";
import {
  OPENAI_MODEL,
  withModelSafeParams,
} from "@/lib/openai/model-params";
import {
  buildReplySystemPrompt,
  buildReplyUserPrompt,
  buildSuggestionsSystemPrompt,
  buildTransformSystemPrompt,
  type ReplyGenerateInput,
} from "./prompts";
import type { ReplyAction } from "./tones";

function getOpenAIClient() {
  const apiKey = resolveOpenAiApiKey();
  if (!apiKey) throw new Error("OpenAI API key is not configured.");
  return new OpenAI({ apiKey });
}

export async function generateEmailReply(
  input: ReplyGenerateInput
): Promise<string> {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create(
    withModelSafeParams({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: buildReplySystemPrompt(input),
        },
        {
          role: "user",
          content: buildReplyUserPrompt(input),
        },
      ],
    })
  );

  const reply = response.choices[0]?.message?.content?.trim();
  if (!reply) throw new Error("OpenAI returned an empty reply.");
  return reply;
}

export async function generateEmailReplyWithRetry(
  input: ReplyGenerateInput
): Promise<string> {
  try {
    return await generateEmailReply(input);
  } catch (firstError) {
    try {
      return await generateEmailReply(input);
    } catch {
      throw firstError;
    }
  }
}

/**
 * Stream a single reply as text deltas.
 */
export async function* streamEmailReply(
  input: ReplyGenerateInput
): AsyncGenerator<string> {
  const openai = getOpenAIClient();
  const stream = await openai.chat.completions.create(
    withModelSafeParams({
      model: OPENAI_MODEL,
      stream: true as const,
      messages: [
        {
          role: "system",
          content: buildReplySystemPrompt(input),
        },
        {
          role: "user",
          content: buildReplyUserPrompt(input),
        },
      ],
    })
  );

  for await (const part of stream) {
    const text = part.choices[0]?.delta?.content ?? "";
    if (text) yield text;
  }
}

export async function generateReplySuggestions(
  input: ReplyGenerateInput
): Promise<string[]> {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create(
    withModelSafeParams({
      model: OPENAI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildSuggestionsSystemPrompt(input),
        },
        {
          role: "user",
          content: buildReplyUserPrompt(input),
        },
      ],
    })
  );

  const raw = response.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error("OpenAI returned empty suggestions.");

  try {
    const parsed = JSON.parse(raw) as { suggestions?: unknown };
    const list = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      : [];
    if (list.length >= 1) return list.slice(0, 3);
  } catch {
    /* fall through */
  }

  // Fallback: three parallel singles
  const results = await Promise.all([
    generateEmailReply(input),
    generateEmailReply(input),
    generateEmailReply(input),
  ]);
  return results;
}

export async function transformEmailReply(input: {
  draft: string;
  action: ReplyAction;
  translateTo?: string;
}): Promise<string> {
  const openai = getOpenAIClient();
  const extra =
    input.action === "translate" && input.translateTo
      ? `\nTarget language: ${input.translateTo}`
      : input.action === "translate"
        ? "\nTarget language: clear natural English (or keep English and clarify)."
        : "";

  const response = await openai.chat.completions.create(
    withModelSafeParams({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: buildTransformSystemPrompt(input.action) + extra,
        },
        {
          role: "user",
          content: `Revise this email draft:\n\n${input.draft.slice(0, 12000)}`,
        },
      ],
    })
  );

  const reply = response.choices[0]?.message?.content?.trim();
  if (!reply) throw new Error("OpenAI returned an empty revision.");
  return reply;
}
