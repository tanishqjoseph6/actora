import type { BillingPeriod, PaidPlanId } from "@/components/billing/pricing-data";
import {
  fetchUsdInrExchangeRate,
  formatInrPaise,
  formatUsdCents,
  usdCentsToInrPaise,
} from "./exchange-rate";

/**
 * USD charge amounts in cents — single source of truth for all pricing.
 * Pro: $20/mo · Team: $69/mo.
 */
export const USD_CHARGE_AMOUNTS: Record<BillingPeriod, Record<PaidPlanId, number>> = {
  monthly: {
    pro: 2000,
    starter: 6900,
  },
};

export function getUsdChargeAmount(
  planId: PaidPlanId,
  period: BillingPeriod
): number {
  return USD_CHARGE_AMOUNTS[period][planId];
}

export function getUsdPriceLabel(
  planId: PaidPlanId,
  period: BillingPeriod
): string {
  return formatUsdCents(getUsdChargeAmount(planId, period));
}

/**
 * Converts a USD plan price to INR paise using the live exchange rate.
 * Only used server-side at checkout — never for display.
 */
export async function getInrChargeAmount(
  planId: PaidPlanId,
  period: BillingPeriod
): Promise<{ paise: number; rate: number }> {
  const { rate } = await fetchUsdInrExchangeRate();
  const usdCents = getUsdChargeAmount(planId, period);
  return {
    paise: usdCentsToInrPaise(usdCents, rate),
    rate,
  };
}

/** Preview approximate INR charge for checkout disclaimer (server-side). */
export async function getInrCheckoutPreview(
  planId: PaidPlanId,
  period: BillingPeriod
): Promise<{
  usdCents: number;
  usdLabel: string;
  inrPaise: number;
  inrLabel: string;
  exchangeRate: number;
}> {
  const usdCents = getUsdChargeAmount(planId, period);
  const { paise, rate } = await getInrChargeAmount(planId, period);
  return {
    usdCents,
    usdLabel: formatUsdCents(usdCents),
    inrPaise: paise,
    inrLabel: formatInrPaise(paise),
    exchangeRate: rate,
  };
}

/** Converts arbitrary USD cents to INR paise using the live rate (credit packs, etc.). */
export async function convertUsdCentsToInrPaise(
  usdCents: number
): Promise<{ paise: number; rate: number }> {
  const { rate } = await fetchUsdInrExchangeRate();
  return {
    paise: usdCentsToInrPaise(usdCents, rate),
    rate,
  };
}
