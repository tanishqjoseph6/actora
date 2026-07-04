"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  PaymentToast,
  usePaymentToastFromUrl,
  type PaymentToastState,
} from "@/components/billing/PaymentToast";
import {
  UpgradeModal,
  useUpgradeModal,
} from "@/components/billing/UpgradeModal";
import {
  BillingHistoryTable,
  RazorpayPlaceholder,
} from "@/components/billing/BillingHistory";
import {
  getDisplayPlans,
  getPlanById,
  type BillingPeriod,
  type PricingPlan,
} from "@/components/billing/pricing-data";
import { BillingHeader } from "@/components/billing/premium/BillingHeader";
import { PremiumPricingCard } from "@/components/billing/premium/PremiumPricingCard";
import { ComparisonTable } from "@/components/billing/premium/ComparisonTable";
import { BillingFaq } from "@/components/billing/premium/BillingFaq";
import { CurrentPlanSection } from "@/components/billing/premium/CurrentPlanSection";
import { parseBillingCurrency } from "@/lib/billing/currency";
import { useBillingCurrency } from "@/hooks/useBillingCurrency";
import { useSubscription } from "@/hooks/useSubscription";
import { useRazorpayCheckout } from "@/hooks/useRazorpayCheckout";
import type { BillingCurrency } from "@/lib/billing/currency";
import type { PlanId } from "@/lib/subscription";

export default function Billing() {
  const { data: session } = useSession();
  const { currency, setCurrency } = useBillingCurrency();
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const displayPlans = useMemo(
    () => getDisplayPlans(currency, period),
    [currency, period]
  );
  const { selection, openUpgrade, closeUpgrade } = useUpgradeModal();
  const { subscription, loading, upgradePlan, refresh } = useSubscription();
  const [toast, setToast] = useState<PaymentToastState>(null);

  usePaymentToastFromUrl(setToast);

  const { openCheckout } = useRazorpayCheckout({
    onSuccess: async (_planId, planName) => {
      closeUpgrade();
      await refresh();
      setToast({
        type: "success",
        title: "Payment successful!",
        message: `Welcome to Actora ${planName}. Your plan is now active.`,
      });
      window.history.replaceState({}, "", "/billing");
    },
    onFailure: (message) => {
      setToast({
        type: "error",
        title: "Payment failed",
        message,
      });
    },
    onCancel: () => {
      setToast({
        type: "info",
        title: "Payment cancelled",
        message: "No charges were made to your account.",
      });
    },
  });

  const handleUpgrade = useCallback(
    (plan: PricingPlan) => {
      if (plan.id === "enterprise") {
        window.location.href =
          "mailto:sales@useactora.com?subject=Actora%20Enterprise%20Inquiry";
        return;
      }

      if (plan.id === "free") return;

      openUpgrade(plan, period, currency);
    },
    [period, currency, openUpgrade]
  );

  const handleUpgradePlan = useCallback(() => {
    const proPlan = getPlanById("pro", currency, period);
    if (proPlan) {
      handleUpgrade(proPlan);
    }
  }, [handleUpgrade, currency, period]);

  const handleDevUpgrade = useCallback(
    async (planId: PlanId) => {
      const success = await upgradePlan(planId, period);
      if (success) {
        closeUpgrade();
        await refresh();
        setToast({
          type: "success",
          title: "Plan activated",
          message: "Your subscription has been updated.",
        });
      }
    },
    [upgradePlan, period, closeUpgrade, refresh]
  );

  const handleCheckout = useCallback(
    async (
      planId: PlanId,
      billingPeriod: BillingPeriod,
      billingCurrency: BillingCurrency,
      razorpayPlanId?: string
    ) => {
      if (!session) {
        setToast({
          type: "error",
          title: "Sign in required",
          message: "Please sign in before upgrading your plan.",
        });
        return;
      }

      await openCheckout(planId, billingPeriod, billingCurrency, razorpayPlanId);
    },
    [session, openCheckout]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get("plan");
    const periodParam = params.get("period");
    const currencyParam = parseBillingCurrency(params.get("currency"));
    const billingPeriod: BillingPeriod =
      periodParam === "yearly" ? "yearly" : "monthly";

    if (currencyParam) {
      setCurrency(currencyParam);
    }

    if (periodParam === "yearly" || periodParam === "monthly") {
      setPeriod(billingPeriod);
    }

    if (planParam === "starter" || planParam === "pro") {
      const plan = getPlanById(planParam, currencyParam ?? currency, billingPeriod);
      if (plan) {
        openUpgrade(plan, billingPeriod, currencyParam ?? currency);
      }
    }

    if (params.has("plan") || params.has("period") || params.has("currency")) {
      window.history.replaceState({}, "", "/billing");
    }
  }, [openUpgrade, setCurrency, currency]);

  return (
    <main className="min-h-screen bg-[#050816] text-white overflow-hidden">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[#3B82F6]/10 blur-[200px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[500px] bg-[#2563EB]/8 blur-[180px] rounded-full pointer-events-none" />
      <div className="fixed top-1/3 -left-32 w-[400px] h-[400px] bg-[#3B82F6]/6 blur-[160px] rounded-full pointer-events-none" />

      <PaymentToast toast={toast} onDismiss={() => setToast(null)} />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-16 lg:py-20">
        <BillingHeader
          period={period}
          currency={currency}
          onPeriodChange={setPeriod}
          onCurrencyChange={setCurrency}
        />

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 lg:gap-6 mb-16 lg:mb-20 items-stretch">
          {displayPlans.map((plan, index) => (
            <PremiumPricingCard
              key={`${plan.id}-${currency}-${period}`}
              plan={plan}
              index={index}
              currentPlanId={subscription?.planId}
              onSelect={handleUpgrade}
            />
          ))}
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
      </div>

      <UpgradeModal
        selection={selection}
        currency={currency}
        onClose={closeUpgrade}
        onDevUpgrade={handleDevUpgrade}
        onCheckout={handleCheckout}
        currentPlanId={subscription?.planId}
      />
    </main>
  );
}
