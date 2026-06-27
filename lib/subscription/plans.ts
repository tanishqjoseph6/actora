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

export function getPlanBadgeStyles(planId: PlanId): {
  badge: string;
  dot: string;
} {
  switch (planId) {
    case "starter":
      return {
        badge: "bg-[#3B82F6]/15 border-[#3B82F6]/30 text-[#60A5FA]",
        dot: "bg-[#60A5FA]",
      };
    case "pro":
      return {
        badge: "bg-gradient-to-r from-[#00CFFF]/20 to-[#3B82F6]/20 border-[#00CFFF]/30 text-[#00CFFF]",
        dot: "bg-[#00CFFF]",
      };
    case "enterprise":
      return {
        badge: "bg-purple-500/15 border-purple-400/30 text-purple-300",
        dot: "bg-purple-400",
      };
    default:
      return {
        badge: "bg-cyan-400/10 border-cyan-400/20 text-gray-400",
        dot: "bg-gray-400",
      };
  }
}
