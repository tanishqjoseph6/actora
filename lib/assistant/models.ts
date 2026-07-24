import type { PlanId } from "@/lib/subscription/types";

export const ROXX_MODEL_IDS = [
  "gpt-4o-mini",
  "gpt-5-mini",
  "gpt-5",
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
 * Free → GPT-4o Mini · Pro → + GPT-5 Mini · Team → + GPT-5
 */
export const ROXX_MODELS: readonly RoxxModelDefinition[] = [
  {
    id: "gpt-4o-mini",
    apiModel: "gpt-4o-mini",
    label: "GPT-4o Mini",
    planLabel: "Included in Free",
    minPlan: "free",
    upgradePlan: "free",
  },
  {
    id: "gpt-5-mini",
    apiModel: "gpt-5-mini",
    label: "GPT-5 Mini",
    planLabel: "Upgrade to Pro",
    minPlan: "pro",
    upgradePlan: "pro",
  },
  {
    id: "gpt-5",
    apiModel: "gpt-5",
    label: "GPT-5",
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

/** Legacy IDs persisted before Roxxx AI V2. */
const LEGACY_MODEL_MAP: Record<string, RoxxModelId> = {
  "gpt-5-mini-priority": "gpt-5",
};

export function normalizeRoxxModelId(value: unknown): RoxxModelId | null {
  if (typeof value !== "string") return null;
  if ((ROXX_MODEL_IDS as readonly string[]).includes(value)) {
    return value as RoxxModelId;
  }
  return LEGACY_MODEL_MAP[value] ?? null;
}

export function isRoxxModelId(value: unknown): value is RoxxModelId {
  return normalizeRoxxModelId(value) !== null;
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

/** Default chat selection — always start on Free-tier model; preference persists separately. */
export function defaultRoxxModelForPlan(_planId: PlanId): RoxxModelId {
  return "gpt-4o-mini";
}

/**
 * Best model automatically used for email AI / non-selector flows.
 * Free/Trial → 4o Mini · Pro → 5 Mini · Team/Enterprise → GPT-5
 */
export function bestRoxxModelForPlan(planId: PlanId): RoxxModelId {
  if (PLAN_RANK[planId] >= MIN_RANK.starter) return "gpt-5";
  if (PLAN_RANK[planId] >= MIN_RANK.pro) return "gpt-5-mini";
  return "gpt-4o-mini";
}

/**
 * Resolve a client-requested model against the subscription plan.
 * Never trusts the client: locked models are rejected (caller returns 403).
 */
export function resolveRoxxModelForPlan(
  planId: PlanId,
  requested: unknown
): {
  model: RoxxModelDefinition;
  allowed: boolean;
  requestedId: RoxxModelId | null;
} {
  const requestedId = normalizeRoxxModelId(requested);

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
