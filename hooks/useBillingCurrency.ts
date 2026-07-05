"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type BillingCurrency,
  parseBillingCurrency,
} from "@/lib/billing/currency";

const STORAGE_KEY = "actora-billing-currency";

type UseBillingCurrencyResult = {
  currency: BillingCurrency;
  setCurrency: (currency: BillingCurrency) => void;
  loading: boolean;
  country: string | null;
};

export function useBillingCurrency(): UseBillingCurrencyResult {
  const [currency, setCurrencyState] = useState<BillingCurrency>("USD");
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState<string | null>(null);

  const setCurrency = useCallback((next: BillingCurrency) => {
    setCurrencyState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      const params = new URLSearchParams(window.location.search);
      const urlCurrency = parseBillingCurrency(params.get("currency"));

      if (urlCurrency) {
        setCurrency(urlCurrency);
        setLoading(false);
        return;
      }

      const saved = parseBillingCurrency(localStorage.getItem(STORAGE_KEY));
      if (saved) {
        setCurrencyState(saved);
        setLoading(false);
        return;
      }

      fetch("/api/geo")
        .then((res) => res.json())
        .then((data: { country?: string; currency?: BillingCurrency }) => {
          if (data.country) setCountry(data.country);
          if (data.currency === "INR" || data.currency === "USD") {
            setCurrencyState(data.currency);
          }
        })
        .catch(() => {
          setCurrencyState("USD");
        })
        .finally(() => {
          setLoading(false);
        });
    });
  }, [setCurrency]);

  return { currency, setCurrency, loading, country };
}
