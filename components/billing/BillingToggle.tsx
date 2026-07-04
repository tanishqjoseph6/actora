"use client";

import type { BillingPeriod } from "./pricing-data";

type BillingToggleProps = {
  period: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
};

export function BillingToggle({ period, onChange }: BillingToggleProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <div className="relative flex items-center p-1 rounded-xl bg-[#0B1220] border border-[rgba(37, 99, 235,0.15)] backdrop-blur-sm">
        <button
          onClick={() => onChange("monthly")}
          className={`relative z-10 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
            period === "monthly"
              ? "text-[#050816] font-semibold"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => onChange("yearly")}
          className={`relative z-10 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
            period === "yearly"
              ? "text-[#050816] font-semibold"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          Yearly
        </button>
        <span
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-[#2563EB] transition-all duration-300 ease-out ${
            period === "yearly" ? "left-[calc(50%+2px)]" : "left-1"
          }`}
          aria-hidden
        />
      </div>

      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2563EB]/15 border border-[#1E293B] text-[#2563EB] text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
        Save 15%
      </span>
    </div>
  );
}
