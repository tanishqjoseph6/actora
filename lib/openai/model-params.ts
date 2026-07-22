import type { ChatCompletionCreateParams } from "openai/resources/chat/completions";

/** Canonical OpenAI model for non-Roxx Actora AI calls. */
export const OPENAI_MODEL = "gpt-5-mini" as const;

/** @deprecated Use OPENAI_MODEL */
export const DEFAULT_OPENAI_MODEL = OPENAI_MODEL;

function modelRejectsSamplingParams(model: string): boolean {
  return /^(o\d|gpt-5)/i.test(model);
}

export type ModelSafeParamOptions = {
  /** Override model (defaults to OPENAI_MODEL). */
  model?: string;
  /** OpenAI service tier — used for Priority Roxx model. */
  serviceTier?: "auto" | "default" | "flex" | "priority";
};

/**
 * Apply project-safe chat params.
 * gpt-5 / o-series reject sampling params such as `temperature`.
 */
export function withModelSafeParams<T extends ChatCompletionCreateParams>(
  params: T,
  options?: ModelSafeParamOptions
): T {
  const {
    temperature,
    top_p,
    presence_penalty,
    frequency_penalty,
    logit_bias: _logit_bias,
    ...rest
  } = params as T & {
    temperature?: number;
    top_p?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    logit_bias?: Record<string, number>;
  };

  const model =
    options?.model ??
    (typeof rest.model === "string" ? rest.model : OPENAI_MODEL);

  const next: Record<string, unknown> = {
    ...rest,
    model,
  };

  if (options?.serviceTier) {
    next.service_tier = options.serviceTier;
  }

  if (!modelRejectsSamplingParams(model)) {
    if (temperature != null) next.temperature = temperature;
    if (top_p != null) next.top_p = top_p;
    if (presence_penalty != null) next.presence_penalty = presence_penalty;
    if (frequency_penalty != null) next.frequency_penalty = frequency_penalty;
  }

  return next as T;
}
