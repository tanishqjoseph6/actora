import type { BillingPeriod, PlanId } from "@/components/billing/pricing-data";
import { YEARLY_DISCOUNT } from "@/components/billing/pricing-data";
import type { BillingCurrency } from "./currency";
import { CURRENCY_SYMBOLS } from "./currency";

type PaidPlanId = "starter" | "pro";

type PlanPricing = {
  monthly: number;
  yearlyDisplay: { monthlyRate: number; annualTotal: number };
  chargeAmounts: Record<BillingPeriod, number>;
};

type CurrencyPricing = Record<PaidPlanId, PlanPricing>;

/** Display + charge amounts per currency. Charge amounts use smallest currency unit. */
export const PRICING_CATALOG: Record<BillingCurrency, CurrencyPricing> = {
  USD: {
    starter: {
      monthly: 19,
      yearlyDisplay: { monthlyRate: 16, annualTotal: 192 },
      chargeAmounts: { monthly: 1900, yearly: 19200 },
    },
    pro: {
      monthly: 49,
      yearlyDisplay: { monthlyRate: 42, annualTotal: 504 },
      chargeAmounts: { monthly: 4900, yearly: 50400 },
    },
  },
  INR: {
    starter: {
      monthly: 1599,
      yearlyDisplay: { monthlyRate: 1359, annualTotal: 16310 },
      chargeAmounts: { monthly: 159900, yearly: 1631000 },
    },
    pro: {
      monthly: 4099,
      yearlyDisplay: { monthlyRate: 3484, annualTotal: 41810 },
      chargeAmounts: { monthly: 409900, yearly: 4181000 },
    },
  },
};

export { YEARLY_DISCOUNT };

export function isPaidPlan(
  planId: PlanId
): planId is PaidPlanId {
  return planId === "starter" || planId === "pro";
}

export function getChargeAmount(
  currency: BillingCurrency,
  planId: PlanId,
  period: BillingPeriod
): number | null {
  if (!isPaidPlan(planId)) return null;
  return PRICING_CATALOG[currency][planId].chargeAmounts[period];
}

export function getDisplayPrice(
  currency: BillingCurrency,
  planId: PlanId,
  monthlyPrice: number | null,
  period: BillingPeriod
): { amount: string; suffix: string; annualTotal?: string } {
  const symbol = CURRENCY_SYMBOLS[currency];

  if (monthlyPrice === null) {
    return { amount: "Custom", suffix: "" };
  }

  if (monthlyPrice === 0) {
    return { amount: `${symbol}0`, suffix: "/month" };
  }

  if (!isPaidPlan(planId)) {
    return { amount: `${symbol}${monthlyPrice}`, suffix: "/month" };
  }

  const pricing = PRICING_CATALOG[currency][planId];

  if (period === "monthly") {
    return {
      amount: `${symbol}${pricing.monthly.toLocaleString("en-US")}`,
      suffix: "/month",
    };
  }

  const { monthlyRate, annualTotal } = pricing.yearlyDisplay;

  return {
    amount: `${symbol}${monthlyRate.toLocaleString("en-US")}`,
    suffix: "/month",
    annualTotal: `billed annually at ${symbol}${annualTotal.toLocaleString("en-US")}/year`,
  };
}

export function getChargeDescription(
  currency: BillingCurrency,
  planId: PlanId,
  period: BillingPeriod
): string {
  const periodLabel = period === "yearly" ? "Yearly" : "Monthly";
  const planName = planId.charAt(0).toUpperCase() + planId.slice(1);
  const symbol = CURRENCY_SYMBOLS[currency];

  if (period === "yearly" && isPaidPlan(planId)) {
    const yearly = PRICING_CATALOG[currency][planId].yearlyDisplay;
    return `Actora ${planName} — ${periodLabel} (${symbol}${yearly.annualTotal.toLocaleString("en-US")}/year)`;
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
