"use client";

import type { BillingCurrency } from "@/lib/billing/currency";
import { CURRENCY_LABELS } from "@/lib/billing/currency";

type CurrencyToggleProps = {
  currency: BillingCurrency;
  onChange: (currency: BillingCurrency) => void;
};

export function CurrencyToggle({ currency, onChange }: CurrencyToggleProps) {
  return (
    <div className="relative flex items-center p-1 rounded-xl bg-[#0B1220] border border-[rgba(37, 99, 235,0.15)] backdrop-blur-sm">
      <button
        onClick={() => onChange("USD")}
        className={`relative z-10 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
          currency === "USD"
            ? "text-[#050816] font-semibold"
            : "text-gray-400 hover:text-gray-300"
        }`}
      >
        {CURRENCY_LABELS.USD}
      </button>
      <button
        onClick={() => onChange("INR")}
        className={`relative z-10 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
          currency === "INR"
            ? "text-[#050816] font-semibold"
            : "text-gray-400 hover:text-gray-300"
        }`}
      >
        {CURRENCY_LABELS.INR}
      </button>
      <span
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-[#2563EB] transition-all duration-300 ease-out ${
          currency === "INR" ? "left-[calc(50%+2px)]" : "left-1"
        }`}
        aria-hidden
      />
    </div>
  );
}
