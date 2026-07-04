"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  PaymentToast,
  type PaymentToastState,
} from "@/components/billing/PaymentToast";
import {
  UpgradeModal,
  useUpgradeModal,
} from "@/components/billing/UpgradeModal";
import { PremiumPricingCard } from "@/components/billing/premium/PremiumPricingCard";
import { PricingToggles } from "@/components/billing/PricingToggles";
import {
  getDisplayPlans,
  getPlanById,
  type BillingPeriod,
  type PricingPlan,
} from "@/components/billing/pricing-data";
import { parseBillingCurrency } from "@/lib/billing/currency";
import { useBillingCurrency } from "@/hooks/useBillingCurrency";
import { useRazorpayCheckout } from "@/hooks/useRazorpayCheckout";
import type { BillingCurrency } from "@/lib/billing/currency";
import type { PlanId } from "@/lib/subscription";

const ENTERPRISE_MAILTO =
  "mailto:sales@useactora.com?subject=Actora%20Enterprise%20Inquiry";

type PricingSectionProps = {
  title: string;
  subtitle: string;
  badge?: string;
  mode?: "billing" | "marketing";
  currentPlanId?: PlanId;
  className?: string;
  syncFromUrl?: boolean;
  onPaymentSuccess?: () => void | Promise<void>;
  onDevUpgrade?: (planId: PlanId) => Promise<void>;
  proUpgradeRequest?: number;
};

export function PricingSection({
  title,
  subtitle,
  badge,
  mode = "billing",
  currentPlanId,
  className = "",
  syncFromUrl = false,
  onPaymentSuccess,
  onDevUpgrade,
  proUpgradeRequest = 0,
}: PricingSectionProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { currency, setCurrency } = useBillingCurrency();
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const { selection, openUpgrade, closeUpgrade } = useUpgradeModal();
  const [toast, setToast] = useState<PaymentToastState>(null);

  const displayPlans = useMemo(
    () => getDisplayPlans(currency, period),
    [currency, period]
  );

  const { openCheckout } = useRazorpayCheckout({
    onSuccess: async (_planId, planName) => {
      closeUpgrade();
      await onPaymentSuccess?.();
      setToast({
        type: "success",
        title: "Payment successful!",
        message: `Welcome to Actora ${planName}. Your plan is now active.`,
      });
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

  const handleSelect = useCallback(
    (plan: PricingPlan) => {
      if (plan.id === "enterprise") {
        window.location.href = ENTERPRISE_MAILTO;
        return;
      }

      if (plan.id === "free") {
        if (mode === "marketing") {
          router.push("/signup");
        }
        return;
      }

      if (!session) {
        const params = new URLSearchParams({
          plan: plan.id,
          period,
          currency,
        });
        router.push(`/login?callbackUrl=${encodeURIComponent(`/billing?${params}`)}`);
        return;
      }

      openUpgrade(plan, period, currency);
    },
    [mode, session, period, currency, openUpgrade, router]
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
    if (!syncFromUrl) return;

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
      const plan = getPlanById(
        planParam,
        currencyParam ?? currency,
        billingPeriod
      );
      if (plan) {
        openUpgrade(plan, billingPeriod, currencyParam ?? currency);
      }
    }

    if (params.has("plan") || params.has("period") || params.has("currency")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [syncFromUrl, openUpgrade, setCurrency, currency]);

  useEffect(() => {
    if (!proUpgradeRequest) return;
    const plan = getPlanById("pro", currency, period);
    if (plan) {
      openUpgrade(plan, period, currency);
    }
  }, [proUpgradeRequest, currency, period, openUpgrade]);

  const isMarketing = mode === "marketing";

  return (
    <>
      <PaymentToast toast={toast} onDismiss={() => setToast(null)} />

      <section className={className}>
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-12"
        >
          {badge && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-[#1E293B] text-[#2563EB] text-xs font-semibold uppercase tracking-wider bg-[#111827]/60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
              {badge}
            </div>
          )}

          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            {title}
          </h2>

          <p className="text-[#94A3B8] mt-4 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>

          <div className="mt-8">
            <PricingToggles
              period={period}
              currency={currency}
              onPeriodChange={setPeriod}
              onCurrencyChange={setCurrency}
            />
          </div>
        </motion.header>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 lg:gap-6 items-stretch">
          {displayPlans.map((plan, index) => (
            <PremiumPricingCard
              key={`${plan.id}-${currency}-${period}`}
              plan={plan}
              index={index}
              currentPlanId={isMarketing ? undefined : currentPlanId}
              marketingMode={isMarketing}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </section>

      <UpgradeModal
        selection={selection}
        currency={currency}
        onClose={closeUpgrade}
        onDevUpgrade={onDevUpgrade}
        onCheckout={handleCheckout}
        currentPlanId={currentPlanId}
      />
    </>
  );
}
