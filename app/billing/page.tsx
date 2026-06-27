"use client";

import { useCallback, useState } from "react";
import { BillingToggle } from "@/components/billing/BillingToggle";
import { PricingCard } from "@/components/billing/PricingCard";
import {
  CurrentPlanCard,
  UsageStats,
} from "@/components/billing/AccountSections";
import {
  BillingHistoryTable,
  RazorpayPlaceholder,
} from "@/components/billing/BillingHistory";
import {
  UpgradeModal,
  useUpgradeModal,
} from "@/components/billing/UpgradeModal";
import {
  PRICING_PLANS,
  getPlanById,
  type BillingPeriod,
  type PricingPlan,
} from "@/components/billing/pricing-data";
import { initiateUpgrade } from "@/lib/billing/upgrade";

export default function Billing() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const { selection, openUpgrade, closeUpgrade } = useUpgradeModal();

  const handleUpgrade = useCallback(
    (plan: PricingPlan) => {
      const result = initiateUpgrade({ plan, period });

      if (result.action === "show_modal") {
        openUpgrade(plan, period);
      }
      // When RAZORPAY_CONNECTED is true, initiateUpgrade will trigger checkout.
    },
    [period, openUpgrade]
  );

  const handleUpgradePlan = useCallback(() => {
    const proPlan = getPlanById("pro");
    if (proPlan) {
      handleUpgrade(proPlan);
    }
  }, [handleUpgrade]);

  return (
    <main className="min-h-screen bg-[#050816] text-white overflow-hidden">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[#3B82F6]/8 blur-[200px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-[#00CFFF]/5 blur-[180px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1 mb-5 rounded-full border border-[rgba(0,255,255,0.25)] text-[#00CFFF] text-sm font-medium bg-[#081226]/60 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00CFFF] animate-pulse" />
            PRICING
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Simple{" "}
            <span className="bg-gradient-to-r from-[#00CFFF] via-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent">
              Pricing
            </span>
          </h1>

          <p className="text-gray-400 mt-4 text-base sm:text-lg max-w-xl mx-auto">
            Scale your inbox automation as your business grows
          </p>

          <div className="mt-8">
            <BillingToggle period={period} onChange={setPeriod} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 lg:gap-6 mb-12 lg:mb-16 items-stretch">
          {PRICING_PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              period={period}
              onUpgrade={handleUpgrade}
            />
          ))}
        </div>

        <div className="space-y-6 lg:space-y-8">
          <CurrentPlanCard onUpgradePlan={handleUpgradePlan} />
          <UsageStats />
          <BillingHistoryTable />
          <RazorpayPlaceholder />
        </div>
      </div>

      <UpgradeModal selection={selection} onClose={closeUpgrade} />
    </main>
  );
}
