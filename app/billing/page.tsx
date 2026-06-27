"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { BillingToggle } from "@/components/billing/BillingToggle";
import { CurrencyToggle } from "@/components/billing/CurrencyToggle";
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
  PaymentToast,
  usePaymentToastFromUrl,
  type PaymentToastState,
} from "@/components/billing/PaymentToast";
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

      openUpgrade(plan, period);
    },
    [period, openUpgrade]
  );

  const handleUpgradePlan = useCallback(() => {
    const proPlan = getPlanById("pro");
    if (proPlan) {
      handleUpgrade(proPlan);
    }
  }, [handleUpgrade]);

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
      billingCurrency: BillingCurrency
    ) => {
      if (!session) {
        setToast({
          type: "error",
          title: "Sign in required",
          message: "Please sign in before upgrading your plan.",
        });
        return;
      }

      await openCheckout(planId, billingPeriod, billingCurrency);
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
      const plan = getPlanById(planParam);
      if (plan) {
        openUpgrade(plan, billingPeriod);
      }
    }

    if (params.has("plan") || params.has("period") || params.has("currency")) {
      window.history.replaceState({}, "", "/billing");
    }
  }, [openUpgrade, setCurrency]);

  return (
    <main className="min-h-screen bg-[#050816] text-white overflow-hidden">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[#3B82F6]/8 blur-[200px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-[#00CFFF]/5 blur-[180px] rounded-full pointer-events-none" />

      <PaymentToast toast={toast} onDismiss={() => setToast(null)} />

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

          <div className="mt-8 flex flex-col items-center gap-4">
            <CurrencyToggle currency={currency} onChange={setCurrency} />
            <BillingToggle period={period} onChange={setPeriod} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 lg:gap-6 mb-12 lg:mb-16 items-stretch">
          {PRICING_PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              period={period}
              currency={currency}
              onUpgrade={handleUpgrade}
              isCurrentPlan={subscription?.planId === plan.id}
            />
          ))}
        </div>

        <div className="space-y-6 lg:space-y-8">
          <CurrentPlanCard
            subscription={subscription}
            loading={loading}
            onUpgradePlan={handleUpgradePlan}
          />
          <UsageStats subscription={subscription} loading={loading} />
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
