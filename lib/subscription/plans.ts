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
  starter: "Team",
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
        badge: "bg-[#1D4ED8]/20 border-[#1D4ED8]/50 text-[#93C5FD]",
        dot: "bg-[#1D4ED8]",
      };
    case "pro":
      return {
        badge: "bg-[#2563EB] border-[#2563EB] text-white",
        dot: "bg-white",
      };
    case "enterprise":
      return {
        badge: "bg-[#050816] border-[#1E293B] text-[#94A3B8]",
        dot: "bg-[#64748B]",
      };
    default:
      return {
        badge: "bg-[#111827] border-[#2563EB]/40 text-[#94A3B8]",
        dot: "bg-[#64748B]",
      };
  }
}
