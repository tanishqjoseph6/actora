import type { ChatCompletionCreateParams } from "openai/resources/chat/completions";

/**
 * GPT-5 and o4-series models reject `temperature` (and some other sampling params).
 * Build chat.completions params with only model-supported fields.
 */

export const DEFAULT_OPENAI_MODEL = "gpt-5-mini";

export function isGpt5OrO4Model(model: string): boolean {
  const id = model.trim().toLowerCase();
  return (
    id.startsWith("gpt-5") ||
    id.startsWith("o4") ||
    id.includes("gpt-5") ||
    id.includes("o4-")
  );
}

/**
 * Returns params suitable for `openai.chat.completions.create`.
 * Strips `temperature` when the model does not support it.
 */
export function withModelSafeParams<T extends ChatCompletionCreateParams>(
  params: T
): T {
  const model =
    typeof params.model === "string" && params.model.trim()
      ? params.model
      : DEFAULT_OPENAI_MODEL;

  if (!isGpt5OrO4Model(model) || params.temperature === undefined) {
    return params;
  }

  const { temperature: _omit, ...rest } = params;
  return rest as T;
}
