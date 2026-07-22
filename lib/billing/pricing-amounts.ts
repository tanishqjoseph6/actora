import type { BillingPeriod, PaidPlanId } from "@/components/billing/pricing-data";
import {
  formatInrPaise,
  getUsdInrExchangeRate,
  usdCentsToInrPaise,
} from "./exchange-rate";

/** USD charge amounts in cents (smallest unit). */
export const USD_CHARGE_AMOUNTS: Record<
  BillingPeriod,
  Record<PaidPlanId, number>
> = {
  monthly: {
    pro: 2500,
    starter: 6900,
  },
  yearly: {
    pro: 25500,
    starter: 70400,
  },
};

/**
 * Explicit INR display/charge amounts in paise.
 * Monthly values match the public pricing page (₹2,199 / ₹6,072).
 * Yearly applies the same 15% annual discount on those monthly rates.
 */
export const INR_CHARGE_AMOUNTS: Record<
  BillingPeriod,
  Record<PaidPlanId, number>
> = {
  monthly: {
    pro: 219_900,
    starter: 607_200,
  },
  yearly: {
    pro: Math.round(2199 * 12 * 0.85) * 100,
    starter: Math.round(6072 * 12 * 0.85) * 100,
  },
};

export function getUsdChargeAmount(
  planId: PaidPlanId,
  period: BillingPeriod
): number {
  return USD_CHARGE_AMOUNTS[period][planId];
}

export function getInrChargeAmount(
  planId: PaidPlanId,
  period: BillingPeriod,
  _rate = getUsdInrExchangeRate()
): number {
  return INR_CHARGE_AMOUNTS[period][planId];
}

export function getUsdPriceLabel(
  planId: PaidPlanId,
  period: BillingPeriod
): string {
  const cents = USD_CHARGE_AMOUNTS[period][planId];
  const dollars = cents / 100;
  if (period === "yearly") {
    const hasFraction = cents % 100 !== 0;
    return `$${dollars.toLocaleString("en-US", {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: hasFraction ? 2 : 0,
    })}`;
  }
  return `$${dollars}`;
}

export function getInrPriceLabel(
  planId: PaidPlanId,
  period: BillingPeriod
): string {
  return formatInrPaise(getInrChargeAmount(planId, period));
}

/** Kept for callers that still convert ad-hoc USD amounts. */
export function convertUsdCentsToInrPaise(usdCents: number): number {
  return usdCentsToInrPaise(usdCents);
}
