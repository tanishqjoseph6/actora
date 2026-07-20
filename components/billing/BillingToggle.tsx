"use client";

import type { BillingPeriod } from "./pricing-data";

type BillingToggleProps = {
  period: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
};

export function BillingToggle({ period, onChange }: BillingToggleProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
      <div className="relative flex items-center rounded-xl border border-white/[0.08] bg-[#0A0A0A] p-1 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => onChange("monthly")}
          className={`relative z-10 rounded-lg px-5 py-2 text-sm font-medium transition-all duration-300 ${
            period === "monthly"
              ? "font-semibold text-white"
              : "text-[#71717A] hover:text-[#A1A1AA]"
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onChange("yearly")}
          className={`relative z-10 rounded-lg px-5 py-2 text-sm font-medium transition-all duration-300 ${
            period === "yearly"
              ? "font-semibold text-white"
              : "text-[#71717A] hover:text-[#A1A1AA]"
          }`}
        >
          Yearly
        </button>
        <span
          className={`absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-lg bg-[#3B82F6] transition-all duration-300 ease-out ${
            period === "yearly" ? "left-[calc(50%+2px)]" : "left-1"
          }`}
          aria-hidden
        />
      </div>

      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/15 px-3 py-1 text-xs font-semibold text-[#3B82F6]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3B82F6]" />
        Save 15%
      </span>
    </div>
  );
}
