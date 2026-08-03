import type { PlanId } from "@/components/billing/pricing-data";

export type PublicApiPlanLimits = {
  monthlyCalls: number;
  requestsPerMinute: number;
};

export const PUBLIC_API_LIMITS: Record<PlanId, PublicApiPlanLimits> = {
  free: { monthlyCalls: 250, requestsPerMinute: 20 },
  trial: { monthlyCalls: 250, requestsPerMinute: 20 },
  pro: { monthlyCalls: 1_500, requestsPerMinute: 300 },
  starter: { monthlyCalls: 5_000, requestsPerMinute: 500 },
  enterprise: { monthlyCalls: Infinity, requestsPerMinute: 1_000 },
};

export function getPublicApiLimits(planId: PlanId): PublicApiPlanLimits {
  return PUBLIC_API_LIMITS[planId] ?? PUBLIC_API_LIMITS.free;
}

export function getPublicApiMonthStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
    .toISOString();
}

export function getPublicApiNextReset(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))
    .toISOString();
}
