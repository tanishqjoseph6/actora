import type { PlanId } from "@/components/billing/pricing-data";

export const GB = 1024 ** 3;

export const STORAGE_LIMITS: Record<PlanId, number> = {
  free: 5 * GB,
  trial: 5 * GB,
  pro: 50 * GB,
  starter: 250 * GB,
  enterprise: Infinity,
};

export function getStorageLimitBytes(planId: PlanId) {
  return STORAGE_LIMITS[planId] ?? STORAGE_LIMITS.free;
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "Unlimited";
  if (bytes < 1024 ** 2) return `${Math.max(0, bytes / 1024).toFixed(0)} KB`;
  if (bytes < GB) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / GB).toFixed(1)} GB`;
}
