"use client";

import type { BillingCurrency } from "@/lib/billing/currency";
import { CURRENCY_LABELS } from "@/lib/billing/currency";

type CurrencyToggleProps = {
  currency: BillingCurrency;
  onChange: (currency: BillingCurrency) => void;
};

export function CurrencyToggle({ currency, onChange }: CurrencyToggleProps) {
  return (
    <div className="relative flex items-center rounded-xl border border-white/[0.08] bg-[#0A0A0A] p-1 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => onChange("USD")}
        className={`relative z-10 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 ${
          currency === "USD"
            ? "font-semibold text-white"
            : "text-[#71717A] hover:text-[#A1A1AA]"
        }`}
      >
        {CURRENCY_LABELS.USD}
      </button>
      <button
        type="button"
        onClick={() => onChange("INR")}
        className={`relative z-10 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 ${
          currency === "INR"
            ? "font-semibold text-white"
            : "text-[#71717A] hover:text-[#A1A1AA]"
        }`}
      >
        {CURRENCY_LABELS.INR}
      </button>
      <span
        className={`absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-lg bg-[#3B82F6] transition-all duration-300 ease-out ${
          currency === "INR" ? "left-[calc(50%+2px)]" : "left-1"
        }`}
        aria-hidden
      />
    </div>
  );
}
