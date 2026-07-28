/**
 * Live USD → INR conversion for Razorpay checkout.
 * Rates are fetched from a public API and cached briefly — never hardcoded.
 */

const EXCHANGE_RATE_API =
  "https://api.frankfurter.app/latest?from=USD&to=INR";

/** In-memory cache to avoid hammering the exchange rate API. */
let cachedRate: { rate: number; fetchedAt: number } | null = null;

/** Cache TTL — balances freshness with API load (10 minutes). */
const CACHE_TTL_MS = 10 * 60 * 1000;

export type ExchangeRateResult = {
  rate: number;
  source: "live" | "cache";
  fetchedAt: string;
};

/**
 * Fetches the latest USD → INR exchange rate from Frankfurter (ECB data).
 * Throws if the rate cannot be retrieved — checkout must not proceed without a live rate.
 */
export async function fetchUsdInrExchangeRate(): Promise<ExchangeRateResult> {
  const now = Date.now();

  if (cachedRate && now - cachedRate.fetchedAt < CACHE_TTL_MS) {
    return {
      rate: cachedRate.rate,
      source: "cache",
      fetchedAt: new Date(cachedRate.fetchedAt).toISOString(),
    };
  }

  const response = await fetch(EXCHANGE_RATE_API, {
    next: { revalidate: 600 },
  });

  if (!response.ok) {
    throw new Error(
      `Exchange rate API unavailable (HTTP ${response.status}). Please try again shortly.`
    );
  }

  const data = (await response.json()) as {
    rates?: { INR?: number };
  };

  const rate = data.rates?.INR;
  if (!rate || !Number.isFinite(rate) || rate <= 0) {
    throw new Error("Exchange rate API returned an invalid USD → INR rate.");
  }

  cachedRate = { rate, fetchedAt: now };

  return {
    rate,
    source: "live",
    fetchedAt: new Date(now).toISOString(),
  };
}

/** Convert USD cents to INR paise using a provided exchange rate. */
export function usdCentsToInrPaise(
  usdCents: number,
  rate: number
): number {
  const usd = usdCents / 100;
  const inr = usd * rate;
  return Math.round(inr * 100);
}

export function formatInrPaise(paise: number): string {
  const value = Math.round(paise / 100);
  return `₹${value.toLocaleString("en-IN")}`;
}

export function formatUsdCents(cents: number): string {
  const dollars = cents / 100;
  const hasFraction = cents % 100 !== 0;
  return `$${dollars.toLocaleString("en-US", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  })}`;
}

/** Standard disclaimer shown before Razorpay checkout for Indian users. */
export function getInrCheckoutDisclaimer(approximateInrLabel: string): string {
  return `You will be charged approximately ${approximateInrLabel} today based on the current USD to INR exchange rate. The final amount is calculated at checkout.`;
}

/** Clears the in-memory rate cache (useful in tests). */
export function clearExchangeRateCache(): void {
  cachedRate = null;
}
