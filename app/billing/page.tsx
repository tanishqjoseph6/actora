"use client";

import { BILLING_TEMPORARILY_DISABLED } from "@/lib/billing/billing-pause";
import { BillingUnavailablePlaceholder } from "@/components/billing/BillingUnavailablePlaceholder";
import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { BillingPageSkeleton } from "@/components/billing/BillingPageSkeleton";
import {
  PaymentToast,
  usePaymentToastFromUrl,
  type PaymentToastState,
} from "@/components/billing/PaymentToast";
import {
  BillingHistoryTable,
  RazorpayStatusCard,
} from "@/components/billing/BillingHistory";
import { BillingOverviewSection } from "@/components/billing/BillingOverviewSection";
import { BillingUsageSection } from "@/components/billing/BillingUsageSection";
import { PricingSection } from "@/components/billing/PricingSection";
import { ComparisonTable } from "@/components/billing/premium/ComparisonTable";
import { BillingFaq } from "@/components/billing/premium/BillingFaq";
import { CurrentPlanSection } from "@/components/billing/premium/CurrentPlanSection";
import { CreditTopUpSection } from "@/components/billing/CreditTopUpSection";
import { AiCreditUsageAlerts } from "@/components/subscription/AiCreditUsageAlerts";
import { TrialBillingCard } from "@/components/billing/TrialBillingCard";
import { useSubscription } from "@/hooks/useSubscription";

export default function Billing() {
  if (BILLING_TEMPORARILY_DISABLED) {
    return <BillingUnavailablePlaceholder />;
  }

  return <BillingPageActive />;
}

function BillingPageActive() {
  const { subscription, loading, refresh } = useSubscription();
  const [toast, setToast] = useState<PaymentToastState>(null);
  const [proUpgradeRequest, setProUpgradeRequest] = useState(0);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  usePaymentToastFromUrl(setToast);

  const handleUpgradePlan = useCallback(() => {
    setProUpgradeRequest((n) => n + 1);
  }, []);

  const handlePaymentSuccess = useCallback(async () => {
    await refresh();
    setHistoryRefreshKey((n) => n + 1);
  }, [refresh]);

  const showTrialCard =
    Boolean(subscription?.trialActive) ||
    Boolean(subscription?.trialExpired && subscription.planId === "free");

  return (
    <main className="min-h-screen overflow-hidden bg-[#0A0A0A] text-white">
      <AiCreditUsageAlerts onUpgradePlan={handleUpgradePlan} />
      <div className="pointer-events-none fixed left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[#3B82F6]/10 blur-[200px]" />
      <div className="pointer-events-none fixed bottom-0 right-0 h-[500px] w-[600px] rounded-full bg-[#2563EB]/8 blur-[180px]" />
      <div className="pointer-events-none fixed -left-32 top-1/3 h-[400px] w-[400px] rounded-full bg-[#3B82F6]/6 blur-[160px]" />

      <PaymentToast toast={toast} onDismiss={() => setToast(null)} />

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        {loading ? (
          <BillingPageSkeleton />
        ) : (
          <>
            {showTrialCard && subscription && (
              <TrialBillingCard subscription={subscription} />
            )}

            <BillingOverviewSection
              subscription={subscription}
              loading={loading}
            />

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="mb-16 space-y-8 lg:mb-20 lg:space-y-10"
            >
              <CurrentPlanSection
                subscription={subscription}
                loading={loading}
                onUpgradePlan={handleUpgradePlan}
                onRefresh={handlePaymentSuccess}
              />
            </motion.div>

            <div id="pricing" className="scroll-mt-24">
              <PricingSection
                badge="Subscription"
                title="Choose your plan"
                subtitle="Upgrade with Razorpay. Free includes 100 credits/month. Pro $20 · Team $69."
                mode="billing"
                currentPlanId={
                  subscription?.planId === "trial"
                    ? "free"
                    : subscription?.planId
                }
                syncFromUrl
                onPaymentSuccess={handlePaymentSuccess}
                proUpgradeRequest={proUpgradeRequest}
                className="mb-16 lg:mb-20"
              />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="mb-16 lg:mb-20"
              id="ai-credits"
            >
              <CreditTopUpSection
                subscription={subscription}
                onPurchaseSuccess={handlePaymentSuccess}
                onToast={setToast}
              />
            </motion.div>

            <BillingUsageSection
              subscription={subscription}
              loading={loading}
            />

            <div className="mb-16 space-y-8 lg:mb-20 lg:space-y-10">
              <ComparisonTable />
              <BillingFaq />
            </div>

            <div className="space-y-6">
              <BillingHistoryTable refreshKey={historyRefreshKey} />
              <RazorpayStatusCard />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
