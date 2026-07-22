import type { PlanId } from "@/lib/subscription/types";

export const ROXX_MODEL_IDS = [
  "gpt-4o-mini",
  "gpt-5-mini",
  "gpt-5-mini-priority",
] as const;

export type RoxxModelId = (typeof ROXX_MODEL_IDS)[number];

export type RoxxModelDefinition = {
  id: RoxxModelId;
  /** OpenAI API model name */
  apiModel: string;
  label: string;
  /** Shown under the model name in the selector */
  planLabel: string;
  /** Minimum plan required (inclusive hierarchy) */
  minPlan: "free" | "pro" | "starter";
  /** Recommended upgrade plan when locked */
  upgradePlan: PlanId;
  /** Optional OpenAI service tier */
  serviceTier?: "priority";
};

/**
 * Catalog for Roxx AI model selector.
 * Free → 4o mini · Pro → + 5 mini · Team → + 5 mini Priority
 */
export const ROXX_MODELS: readonly RoxxModelDefinition[] = [
  {
    id: "gpt-4o-mini",
    apiModel: "gpt-4o-mini",
    label: "GPT-4o mini",
    planLabel: "Included in Free",
    minPlan: "free",
    upgradePlan: "free",
  },
  {
    id: "gpt-5-mini",
    apiModel: "gpt-5-mini",
    label: "GPT-5 mini",
    planLabel: "Upgrade to Pro",
    minPlan: "pro",
    upgradePlan: "pro",
  },
  {
    id: "gpt-5-mini-priority",
    apiModel: "gpt-5-mini",
    label: "GPT-5 mini (Priority)",
    planLabel: "Upgrade to Team",
    minPlan: "starter",
    upgradePlan: "starter",
  },
] as const;

const PLAN_RANK: Record<PlanId, number> = {
  free: 0,
  trial: 0,
  pro: 2,
  starter: 3,
  enterprise: 4,
};

const MIN_RANK: Record<RoxxModelDefinition["minPlan"], number> = {
  free: 0,
  pro: 2,
  starter: 3,
};

export function isRoxxModelId(value: unknown): value is RoxxModelId {
  return (
    typeof value === "string" &&
    (ROXX_MODEL_IDS as readonly string[]).includes(value)
  );
}

export function getRoxxModel(id: RoxxModelId): RoxxModelDefinition {
  const found = ROXX_MODELS.find((m) => m.id === id);
  if (!found) return ROXX_MODELS[0];
  return found;
}

export function planAllowsRoxxModel(planId: PlanId, modelId: RoxxModelId): boolean {
  const model = getRoxxModel(modelId);
  return PLAN_RANK[planId] >= MIN_RANK[model.minPlan];
}

export function defaultRoxxModelForPlan(planId: PlanId): RoxxModelId {
  // Prefer the highest allowed model the user previously… no — default to free tier model
  // unless they have access; UX: Free starts on 4o mini. Pro/Team still default to 4o mini
  // until they pick; persistence handles preference.
  return "gpt-4o-mini";
}

/**
 * Resolve a client-requested model against the subscription plan.
 * Never trusts the client: locked models fall back to the default allowed model.
 */
export function resolveRoxxModelForPlan(
  planId: PlanId,
  requested: unknown
): {
  model: RoxxModelDefinition;
  allowed: boolean;
  requestedId: RoxxModelId | null;
} {
  const requestedId = isRoxxModelId(requested) ? requested : null;

  if (requestedId && planAllowsRoxxModel(planId, requestedId)) {
    return {
      model: getRoxxModel(requestedId),
      allowed: true,
      requestedId,
    };
  }

  if (requestedId && !planAllowsRoxxModel(planId, requestedId)) {
    return {
      model: getRoxxModel(defaultRoxxModelForPlan(planId)),
      allowed: false,
      requestedId,
    };
  }

  return {
    model: getRoxxModel(defaultRoxxModelForPlan(planId)),
    allowed: true,
    requestedId,
  };
}

export function listRoxxModelsForUi(planId: PlanId) {
  return ROXX_MODELS.map((model) => ({
    ...model,
    locked: !planAllowsRoxxModel(planId, model.id),
  }));
}
