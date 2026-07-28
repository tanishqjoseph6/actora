"use client";

import type { BillingPeriod } from "./pricing-data";
import { BillingToggle } from "./BillingToggle";

type PricingTogglesProps = {
  period: BillingPeriod;
  onPeriodChange: (period: BillingPeriod) => void;
};

export function PricingToggles({
  period,
  onPeriodChange,
}: PricingTogglesProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <BillingToggle period={period} onChange={onPeriodChange} />
    </div>
  );
}
