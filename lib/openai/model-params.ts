import type { ChatCompletionCreateParams } from "openai/resources/chat/completions";

/** Canonical OpenAI model for all Actora API calls. */
export const OPENAI_MODEL = "gpt-5-mini" as const;

/** @deprecated Use OPENAI_MODEL */
export const DEFAULT_OPENAI_MODEL = OPENAI_MODEL;

/**
 * gpt-5-mini rejects sampling params such as `temperature`.
 * Force the project model and strip unsupported fields.
 */
export function withModelSafeParams<T extends ChatCompletionCreateParams>(
  params: T
): T {
  const {
    temperature: _temperature,
    top_p: _top_p,
    presence_penalty: _presence_penalty,
    frequency_penalty: _frequency_penalty,
    logit_bias: _logit_bias,
    ...rest
  } = params as T & {
    temperature?: number;
    top_p?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    logit_bias?: Record<string, number>;
  };

  return {
    ...rest,
    model: OPENAI_MODEL,
  } as T;
}
