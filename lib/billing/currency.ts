export type BillingCurrency = "USD" | "INR";

export const BILLING_CURRENCIES: BillingCurrency[] = ["USD", "INR"];

export const CURRENCY_LABELS: Record<BillingCurrency, string> = {
  USD: "USD ($)",
  INR: "INR (₹)",
};

export const CURRENCY_SYMBOLS: Record<BillingCurrency, string> = {
  USD: "$",
  INR: "₹",
};

export function currencyFromCountry(countryCode: string | null | undefined): BillingCurrency {
  return countryCode?.toUpperCase() === "IN" ? "INR" : "USD";
}

export function isBillingCurrency(value: string | null | undefined): value is BillingCurrency {
  return value === "USD" || value === "INR";
}

export function parseBillingCurrency(value: string | null | undefined): BillingCurrency | null {
  if (!value) return null;
  const normalized = value.toUpperCase();
  return isBillingCurrency(normalized) ? normalized : null;
}
