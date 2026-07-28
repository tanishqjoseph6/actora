"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type BillingCurrency,
  parseBillingCurrency,
} from "@/lib/billing/currency";
import type { PaymentRegion } from "@/lib/billing/payment-region";

const STORAGE_KEY = "actora-payment-region";

type UsePaymentRegionResult = {
  /** Currency used at checkout (INR for India, USD for international). */
  paymentCurrency: BillingCurrency;
  /** Whether the user is in India (Razorpay INR checkout). */
  isIndia: boolean;
  loading: boolean;
  country: string | null;
};

/**
 * Determines payment region for checkout routing.
 * Display prices are always USD — this hook only affects which provider/currency is used at checkout.
 */
export function usePaymentRegion(): UsePaymentRegionResult {
  const [paymentCurrency, setPaymentCurrency] = useState<BillingCurrency>("USD");
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      fetch("/api/geo")
        .then((res) => res.json())
        .then((data: { country?: string; currency?: BillingCurrency }) => {
          if (data.country) setCountry(data.country);
          const currency =
            data.currency === "INR" || data.currency === "USD"
              ? data.currency
              : "USD";
          setPaymentCurrency(currency);
          const region: PaymentRegion = currency === "INR" ? "IN" : "INTL";
          localStorage.setItem(STORAGE_KEY, region);
        })
        .catch(() => {
          const saved = localStorage.getItem(STORAGE_KEY);
          setPaymentCurrency(saved === "IN" ? "INR" : "USD");
        })
        .finally(() => {
          setLoading(false);
        });
    });
  }, []);

  return {
    paymentCurrency,
    isIndia: paymentCurrency === "INR",
    loading,
    country,
  };
}

/** @deprecated Use usePaymentRegion — display is always USD now. */
export function useBillingCurrency() {
  const { paymentCurrency, loading, country } = usePaymentRegion();

  const setCurrency = useCallback((_next: BillingCurrency) => {
    // No-op: currency toggle removed; display is always USD.
  }, []);

  return {
    currency: "USD" as BillingCurrency,
    paymentCurrency,
    setCurrency,
    loading,
    country,
  };
}

export { parseBillingCurrency };
