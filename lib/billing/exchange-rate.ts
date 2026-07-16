/** Default USD → INR rate (July 2026). Override via USD_INR_EXCHANGE_RATE. */
export const DEFAULT_USD_INR_RATE = 88;

export function getUsdInrExchangeRate(): number {
  const raw = process.env.USD_INR_EXCHANGE_RATE?.trim();
  if (!raw) return DEFAULT_USD_INR_RATE;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_USD_INR_RATE;
  return parsed;
}

/** Convert USD cents to INR paise using the configured exchange rate. */
export function usdCentsToInrPaise(usdCents: number, rate = getUsdInrExchangeRate()): number {
  const usd = usdCents / 100;
  const inr = usd * rate;
  return Math.round(inr * 100);
}

export function formatInrPaise(paise: number): string {
  const value = Math.round(paise / 100);
  return `₹${value.toLocaleString("en-IN")}`;
}
