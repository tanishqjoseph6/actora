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
    starter: 70380,
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
  rate = getUsdInrExchangeRate()
): number {
  return usdCentsToInrPaise(USD_CHARGE_AMOUNTS[period][planId], rate);
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
  period: BillingPeriod,
  rate = getUsdInrExchangeRate()
): string {
  return formatInrPaise(getInrChargeAmount(planId, period, rate));
}
