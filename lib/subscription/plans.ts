import type { PlanId } from "./types";
import type { PlanLimits } from "./types";

export const DEFAULT_PLAN_ID: PlanId = "free";

/**
 * AI credit allotments per billing cycle + inbox caps.
 * Trial: 100 credits / 14 days. Pro: 5,000. Team: 50,000.
 */
export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    aiActionsPerMonth: 100,
    inboxes: 1,
    unlimited: false,
  },
  trial: {
    aiActionsPerMonth: 100,
    inboxes: 1,
    unlimited: false,
  },
  starter: {
    aiActionsPerMonth: 50_000,
    inboxes: Infinity,
    unlimited: false,
  },
  pro: {
    aiActionsPerMonth: 5_000,
    inboxes: 5,
    unlimited: false,
  },
  enterprise: {
    aiActionsPerMonth: Infinity,
    inboxes: Infinity,
    unlimited: true,
  },
};

export const PLAN_DISPLAY_NAMES: Record<PlanId, string> = {
  free: "Free",
  trial: "Free Trial",
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
  if (isUnlimited(value)) return "Unlimited";
  return value.toLocaleString("en-IN");
}

export function getPlanBadgeStyles(planId: PlanId): {
  badge: string;
  dot: string;
} {
  switch (planId) {
    case "trial":
      return {
        badge: "bg-[#2563EB]/15 border-[#2563EB]/40 text-[#93C5FD]",
        dot: "bg-[#3B82F6]",
      };
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
        badge: "bg-[#05070B] border-[#1E293B] text-[#94A3B8]",
        dot: "bg-[#64748B]",
      };
    default:
      return {
        badge: "bg-[#111827] border-[#2563EB]/40 text-[#94A3B8]",
        dot: "bg-[#64748B]",
      };
  }
}
