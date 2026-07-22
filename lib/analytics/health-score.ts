import type { HealthRating, ProductivityBreakdown } from "./types";

export function scoreToRating(score: number): HealthRating {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "average";
  return "needs_attention";
}

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Weighted workspace health from component scores (0–100 each). */
export function computeWorkspaceHealth(breakdown: ProductivityBreakdown): number {
  const weighted =
    breakdown.inboxZero * 0.2 +
    breakdown.crmActivity * 0.2 +
    breakdown.tasksCompleted * 0.2 +
    breakdown.meetingsAttended * 0.15 +
    breakdown.automationUsage * 0.15 +
    breakdown.roxxUsage * 0.1;
  return clampScore(weighted);
}

export function ratioScore(numerator: number, denominator: number): number {
  if (denominator <= 0) return numerator > 0 ? 40 : 0;
  return clampScore((numerator / denominator) * 100);
}

export function activityScore(count: number, target: number): number {
  if (count <= 0) return 0;
  return clampScore(Math.min(100, (count / target) * 100));
}
