import type { PlanId } from "./types";
import type { PlanLimits } from "./types";

export const DEFAULT_PLAN_ID: PlanId = "free";

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    aiActionsPerMonth: 50,
    inboxes: 1,
    unlimited: false,
  },
  starter: {
    aiActionsPerMonth: 1000,
    inboxes: 3,
    unlimited: false,
  },
  pro: {
    aiActionsPerMonth: Infinity,
    inboxes: Infinity,
    unlimited: true,
  },
  enterprise: {
    aiActionsPerMonth: Infinity,
    inboxes: Infinity,
    unlimited: true,
  },
};

export const PLAN_DISPLAY_NAMES: Record<PlanId, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

export function getPlanLimits(planId: PlanId): PlanLimits {
  return PLAN_LIMITS[planId] ?? PLAN_LIMITS.free;
}

export function getPlanDisplayName(planId: PlanId): string {
  return PLAN_DISPLAY_NAMES[planId] ?? "Free";
}

export function isUnlimited(value: number): boolean {
  return !Number.isFinite(value);
}

export function formatLimit(value: number): string {
  return isUnlimited(value) ? "Unlimited" : String(value);
}
