export const AI_CREDIT_USAGE_MILESTONES = [25, 50, 75, 90, 100] as const;

export type AiCreditUsageMilestone =
  (typeof AI_CREDIT_USAGE_MILESTONES)[number];

/** Email alerts fire at these thresholds only. */
export const AI_CREDIT_EMAIL_MILESTONES: AiCreditUsageMilestone[] = [
  50, 75, 90, 100,
];

export type AiCreditMilestoneTone = "green" | "yellow" | "orange" | "red";

export function milestoneTone(
  milestone: AiCreditUsageMilestone
): AiCreditMilestoneTone {
  if (milestone <= 25) return "green";
  if (milestone <= 50) return "yellow";
  if (milestone <= 75) return "orange";
  return "red";
}

export function milestoneMessage(milestone: AiCreditUsageMilestone): string {
  switch (milestone) {
    case 25:
      return "You've used 25% of your monthly AI credits.";
    case 50:
      return "You've used 50% of your monthly AI credits.";
    case 75:
      return "You've used 75% of your monthly AI credits. Consider purchasing additional credits.";
    case 90:
      return "Only 10% of your monthly AI credits remain.";
    case 100:
      return "You've used all of your monthly AI credits.";
    default:
      return "Your AI credit usage has changed.";
  }
}

export function milestoneTitle(milestone: AiCreditUsageMilestone): string {
  if (milestone === 100) return "Monthly AI credits exhausted";
  if (milestone === 90) return "AI credits running low";
  return `${milestone}% of monthly AI credits used`;
}

export function computeMonthlyPercentUsed(
  monthlyUsed: number,
  monthlyAllotment: number
): number {
  if (!Number.isFinite(monthlyAllotment) || monthlyAllotment <= 0) return 0;
  return Math.min(
    100,
    Math.floor((Math.max(0, monthlyUsed) / monthlyAllotment) * 100)
  );
}

export function reachedMilestones(
  percentUsed: number
): AiCreditUsageMilestone[] {
  return AI_CREDIT_USAGE_MILESTONES.filter((m) => percentUsed >= m);
}
