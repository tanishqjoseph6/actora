"use client";

import { motion } from "framer-motion";
import type { BillingPeriod } from "../pricing-data";
import type { BillingCurrency } from "@/lib/billing/currency";
import { BillingToggle } from "../BillingToggle";
import { CurrencyToggle } from "../CurrencyToggle";

type BillingHeaderProps = {
  period: BillingPeriod;
  currency: BillingCurrency;
  onPeriodChange: (period: BillingPeriod) => void;
  onCurrencyChange: (currency: BillingCurrency) => void;
};

export function BillingHeader({
  period,
  currency,
  onPeriodChange,
  onCurrencyChange,
}: BillingHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center mb-12 sm:mb-16"
    >
      <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-[#1E293B] text-[#2563EB] text-xs font-semibold uppercase tracking-wider bg-[#111827]/60 backdrop-blur-md">
        <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
        Billing
      </div>

      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
        Billing
      </h1>

      <p className="text-gray-400 mt-4 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
        Manage your subscription, invoices and usage.
      </p>

      <div className="mt-8 flex flex-col items-center gap-4">
        <CurrencyToggle currency={currency} onChange={onCurrencyChange} />
        <BillingToggle period={period} onChange={onPeriodChange} />
      </div>
    </motion.header>
  );
}
