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
  RazorpayPlaceholder,
} from "@/components/billing/BillingHistory";
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

  usePaymentToastFromUrl(setToast);

  const handleUpgradePlan = useCallback(() => {
    setProUpgradeRequest((n) => n + 1);
  }, []);

  const showTrialCard =
    Boolean(subscription?.trialActive) ||
    Boolean(subscription?.trialExpired && subscription.planId === "free");

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden">
      <AiCreditUsageAlerts onUpgradePlan={handleUpgradePlan} />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[#3B82F6]/10 blur-[200px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[500px] bg-[#2563EB]/8 blur-[180px] rounded-full pointer-events-none" />
      <div className="fixed top-1/3 -left-32 w-[400px] h-[400px] bg-[#3B82F6]/6 blur-[160px] rounded-full pointer-events-none" />

      <PaymentToast toast={toast} onDismiss={() => setToast(null)} />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-16 lg:py-20">
        {loading ? (
          <BillingPageSkeleton />
        ) : (
          <>
            {showTrialCard && subscription && (
              <TrialBillingCard subscription={subscription} />
            )}

            <div id="pricing">
              <PricingSection
                badge="Billing"
                title="Billing"
                subtitle="Manage your subscription, invoices and usage."
                mode="billing"
                currentPlanId={
                  subscription?.planId === "trial"
                    ? "free"
                    : subscription?.planId
                }
                syncFromUrl
                onPaymentSuccess={refresh}
                proUpgradeRequest={proUpgradeRequest}
                className="mb-16 lg:mb-20"
              />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="space-y-8 lg:space-y-10 mb-16 lg:mb-20"
            >
              <CurrentPlanSection
                subscription={subscription}
                loading={loading}
                onUpgradePlan={handleUpgradePlan}
                onRefresh={refresh}
              />
            </motion.div>

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
                onPurchaseSuccess={refresh}
              />
            </motion.div>

            <div className="space-y-8 lg:space-y-10 mb-16 lg:mb-20">
              <ComparisonTable />
              <BillingFaq />
            </div>

            <div className="space-y-6">
              <BillingHistoryTable />
              <RazorpayPlaceholder />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
