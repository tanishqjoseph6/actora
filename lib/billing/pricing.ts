import type { BillingPeriod, PlanId } from "@/components/billing/pricing-data";
import { YEARLY_DISPLAY_PRICES } from "@/components/billing/pricing-data";

/** Paid plans only — amounts in smallest currency unit (cents for USD). */
export const CHARGE_AMOUNTS: Record<
  "starter" | "pro",
  Record<BillingPeriod, number>
> = {
  starter: {
    monthly: 1900,
    yearly: 19200,
  },
  pro: {
    monthly: 4900,
    yearly: 50400,
  },
};

export function isPaidPlan(
  planId: PlanId
): planId is "starter" | "pro" {
  return planId === "starter" || planId === "pro";
}

export function getChargeAmount(
  planId: PlanId,
  period: BillingPeriod
): number | null {
  if (!isPaidPlan(planId)) return null;
  return CHARGE_AMOUNTS[planId][period];
}

export function getChargeDescription(
  planId: PlanId,
  period: BillingPeriod
): string {
  const periodLabel = period === "yearly" ? "Yearly" : "Monthly";
  const planName = planId.charAt(0).toUpperCase() + planId.slice(1);

  if (period === "yearly" && isPaidPlan(planId)) {
    const yearly = YEARLY_DISPLAY_PRICES[planId];
    if (yearly) {
      return `Actora ${planName} — ${periodLabel} ($${yearly.annualTotal}/year)`;
    }
  }

  return `Actora ${planName} — ${periodLabel}`;
}

export function formatChargeAmount(amount: number, currency: string): string {
  if (currency === "USD") {
    return `$${(amount / 100).toFixed(2)}`;
  }
  if (currency === "INR") {
    return `₹${(amount / 100).toFixed(2)}`;
  }
  return `${amount / 100} ${currency}`;
}
