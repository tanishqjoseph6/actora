import type { NextRequest } from "next/server";
import type { BillingCurrency } from "./currency";
import { currencyFromCountry } from "./currency";

export type PaymentRegion = "IN" | "INTL";

/** Detect country from CDN / proxy headers (same sources as /api/geo). */
export function detectCountryFromRequest(request: NextRequest): string {
  return (
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-country") ||
    request.headers.get("x-nf-country") ||
    "US"
  );
}

export function paymentRegionFromCountry(
  countryCode: string | null | undefined
): PaymentRegion {
  return countryCode?.toUpperCase() === "IN" ? "IN" : "INTL";
}

export function paymentCurrencyForRegion(
  region: PaymentRegion
): BillingCurrency {
  return region === "IN" ? "INR" : "USD";
}

/** Resolve payment currency for a checkout request (server-side). */
export function resolvePaymentCurrency(request: NextRequest): BillingCurrency {
  const country = detectCountryFromRequest(request);
  return currencyFromCountry(country);
}

export function isIndiaPaymentRegion(region: PaymentRegion): boolean {
  return region === "IN";
}
