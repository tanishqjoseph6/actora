import type { PlanId } from "@/lib/subscription";
import type { FairUsagePlanConfig } from "./types";

/** Fallback limits when DB config is unavailable (matches migration seed). */
export const DEFAULT_FAIR_USAGE_BY_PLAN: Record<PlanId, FairUsagePlanConfig> = {
  free: {
    planId: "free",
    continuousLimitSeconds: 15 * 60,
    cooldownSeconds: 20 * 60,
    inactivityResetSeconds: 600,
    enabled: true,
    unlimited: false,
  },
  trial: {
    planId: "trial",
    continuousLimitSeconds: 15 * 60,
    cooldownSeconds: 20 * 60,
    inactivityResetSeconds: 600,
    enabled: true,
    unlimited: false,
  },
  pro: {
    planId: "pro",
    continuousLimitSeconds: 45 * 60,
    cooldownSeconds: 10 * 60,
    inactivityResetSeconds: 600,
    enabled: true,
    unlimited: false,
  },
  starter: {
    planId: "starter",
    continuousLimitSeconds: null,
    cooldownSeconds: 0,
    inactivityResetSeconds: 600,
    enabled: true,
    unlimited: true,
  },
  enterprise: {
    planId: "enterprise",
    continuousLimitSeconds: null,
    cooldownSeconds: 0,
    inactivityResetSeconds: 600,
    enabled: true,
    unlimited: true,
  },
};

export function getDefaultFairUsageConfig(planId: PlanId): FairUsagePlanConfig {
  return DEFAULT_FAIR_USAGE_BY_PLAN[planId] ?? DEFAULT_FAIR_USAGE_BY_PLAN.free;
}

export function getFairUsageUpgradePlan(planId: PlanId): PlanId | null {
  switch (planId) {
    case "free":
    case "trial":
      return "pro";
    case "pro":
      return "starter";
    default:
      return null;
  }
}
