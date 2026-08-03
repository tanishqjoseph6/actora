import type {
  BillingPeriod,
  PaidPlanId,
  PlanId,
} from "@/components/billing/pricing-data";
import {
  getPlanPriceConfig,
} from "@/components/billing/pricing-data";
import type { BillingCurrency } from "./currency";
import { CURRENCY_SYMBOLS } from "./currency";
import {
  convertUsdCentsToInrPaise,
  getUsdChargeAmount,
} from "./pricing-amounts";

export function isPaidPlan(planId: PlanId): planId is PaidPlanId {
  return planId === "starter" || planId === "pro";
}

/**
 * Returns the charge amount in the currency's smallest unit.
 * USD amounts are synchronous; INR amounts require a live exchange rate fetch.
 */
export async function getChargeAmount(
  currency: BillingCurrency,
  planId: PlanId,
  period: BillingPeriod
): Promise<number | null> {
  if (!isPaidPlan(planId)) return null;

  if (currency === "USD") {
    return getUsdChargeAmount(planId, period);
  }

  const { paise } = await convertUsdCentsToInrPaise(
    getUsdChargeAmount(planId, period)
  );
  return paise;
}

export function getDisplayPrice(
  planId: PlanId,
  period: BillingPeriod
): {
  amount: string;
  suffix: string;
  billingNote?: string;
} {
  if (planId === "enterprise") {
    return { amount: "Custom", suffix: "" };
  }

  if (planId === "free") {
    return { amount: "$0", suffix: "/month" };
  }

  if (!isPaidPlan(planId)) {
    return { amount: "", suffix: "" };
  }

  const config = getPlanPriceConfig(period, planId);
  return {
    amount: config.priceLabel,
    suffix: config.priceSuffix,
    billingNote: config.billingNote,
  };
}

export function getChargeDescription(
  currency: BillingCurrency,
  planId: PlanId,
  period: BillingPeriod
): string {
  const periodLabel = "Monthly";
  const planName =
    planId === "starter"
      ? "Team"
      : planId.charAt(0).toUpperCase() + planId.slice(1);

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
