"use client";

import type { BillingPeriod } from "./pricing-data";
import type { BillingCurrency } from "@/lib/billing/currency";
import { BillingToggle } from "./BillingToggle";
import { CurrencyToggle } from "./CurrencyToggle";

type PricingTogglesProps = {
  period: BillingPeriod;
  currency: BillingCurrency;
  onPeriodChange: (period: BillingPeriod) => void;
  onCurrencyChange: (currency: BillingCurrency) => void;
};

export function PricingToggles({
  period,
  currency,
  onPeriodChange,
  onCurrencyChange,
}: PricingTogglesProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <CurrencyToggle currency={currency} onChange={onCurrencyChange} />
      <BillingToggle period={period} onChange={onPeriodChange} />
    </div>
  );
}
