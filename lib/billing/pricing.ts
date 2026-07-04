import type {
  BillingPeriod,
  PaidPlanId,
  PlanId,
} from "@/components/billing/pricing-data";
import {
  BILLING_PRICING,
  getPlanPriceConfig,
  getRazorpayPlanId as resolveRazorpayPlanId,
  YEARLY_DISCOUNT,
} from "@/components/billing/pricing-data";
import type { BillingCurrency } from "./currency";
import { CURRENCY_SYMBOLS } from "./currency";

export { YEARLY_DISCOUNT };

export function isPaidPlan(planId: PlanId): planId is PaidPlanId {
  return planId === "starter" || planId === "pro";
}

export function getChargeAmount(
  currency: BillingCurrency,
  planId: PlanId,
  period: BillingPeriod
): number | null {
  if (!isPaidPlan(planId)) return null;
  return BILLING_PRICING[currency][period][planId].chargeAmount;
}

export function getRazorpayPlanId(
  planId: PlanId,
  period: BillingPeriod
): string | null {
  if (!isPaidPlan(planId)) return null;
  return resolveRazorpayPlanId(planId, period);
}

export function getDisplayPrice(
  currency: BillingCurrency,
  planId: PlanId,
  period: BillingPeriod
): {
  amount: string;
  suffix: string;
  billingNote?: string;
  saveNote?: string;
  razorpayPlanId?: string;
} {
  if (planId === "enterprise") {
    return { amount: "Custom", suffix: "" };
  }

  if (planId === "free") {
    const symbol = CURRENCY_SYMBOLS[currency];
    return { amount: `${symbol}0`, suffix: "/month" };
  }

  if (!isPaidPlan(planId)) {
    return { amount: "", suffix: "" };
  }

  const config = getPlanPriceConfig(currency, period, planId);
  return {
    amount: config.priceLabel,
    suffix: config.priceSuffix,
    billingNote: config.billingNote,
    saveNote: config.saveNote,
    razorpayPlanId: config.razorpayPlanId,
  };
}

export function getChargeDescription(
  currency: BillingCurrency,
  planId: PlanId,
  period: BillingPeriod
): string {
  const periodLabel = period === "yearly" ? "Yearly" : "Monthly";
  const planName = planId === "starter" ? "Team" : planId.charAt(0).toUpperCase() + planId.slice(1);

  if (period === "yearly" && isPaidPlan(planId)) {
    const config = BILLING_PRICING[currency][period][planId];
    return `Actora ${planName} — ${periodLabel} (${config.priceLabel}${config.priceSuffix})`;
  }

  return `Actora ${planName} — ${periodLabel}`;
}

export function formatChargeAmount(
  amount: number,
  currency: BillingCurrency
): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const value = (amount / 100).toLocaleString("en-US", {
    minimumFractionDigits: currency === "USD" ? 2 : 0,
    maximumFractionDigits: currency === "USD" ? 2 : 0,
  });
  return `${symbol}${value}`;
}
