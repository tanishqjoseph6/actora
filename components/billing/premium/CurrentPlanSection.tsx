"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import type { SubscriptionSnapshot } from "@/lib/subscription";
import { isPaidPlanId } from "@/lib/trial/helpers";
import {
  CurrentPlanBadge,
  formatRenewalDate,
  PlanUsageDisplay,
} from "@/components/subscription/CurrentPlanBadge";
import { AiCreditsCard } from "@/components/subscription/AiCreditsCard";
import { AiCreditUsageHistory } from "@/components/subscription/AiCreditUsageHistory";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ComingSoonBadge,
  useBillingPause,
} from "@/components/billing/BillingPauseProvider";

type CurrentPlanSectionProps = {
  subscription: SubscriptionSnapshot | null;
  loading?: boolean;
  onUpgradePlan?: () => void;
  onRefresh?: () => void | Promise<void>;
};

function formatBillingCycle(interval?: string): string {
  if (interval === "yearly") return "Yearly";
  if (interval === "monthly") return "Monthly";
  return "—";
}

export function CurrentPlanSection({
  subscription,
  loading,
  onUpgradePlan,
  onRefresh,
}: CurrentPlanSectionProps) {
  const { paused, showComingSoon } = useBillingPause();
  const [canceling, setCanceling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const renewalDate = subscription
    ? formatRenewalDate(subscription.currentPeriodEnd)
    : "—";

  const isPaid =
    subscription && isPaidPlanId(subscription.planId) && !subscription.trialActive;
  const isCanceled = subscription?.status === "canceled";

  const handleCancel = useCallback(async () => {
    setCanceling(true);
    setCancelMessage(null);
    try {
      const response = await fetch("/api/billing/cancel", { method: "POST" });
      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
        error?: string;
      };
      if (!response.ok) {
        setCancelMessage(data.error ?? "Failed to cancel subscription.");
        return;
      }
      setCancelMessage(data.message ?? "Subscription scheduled to cancel.");
      setShowCancelConfirm(false);
      await onRefresh?.();
    } catch {
      setCancelMessage("Failed to cancel subscription.");
    } finally {
      setCanceling(false);
    }
  }, [onRefresh]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="grid lg:grid-cols-2 gap-6"
    >
      <div className={`${dashboard.cardLg} p-6 sm:p-8`}>
        <p className={`text-xs font-semibold uppercase tracking-wider ${dashboard.subtle} mb-3`}>
          Current plan
        </p>
        <CurrentPlanBadge subscription={subscription} loading={loading} />
        {loading ? (
          <>
            <Skeleton className="h-4 w-44 mt-3" />
            <div className="flex flex-wrap gap-3 mt-6">
              <Skeleton className="h-10 w-32 rounded-2xl" />
              <Skeleton className="h-10 w-44 rounded-2xl" />
            </div>
          </>
        ) : (
          <>
            <div className={`mt-4 space-y-1.5 text-sm ${dashboard.muted}`}>
              <p>
                Billing cycle:{" "}
                <span className="text-white">
                  {subscription?.trialActive
                    ? "14-day trial"
                    : formatBillingCycle(subscription?.billingInterval)}
                </span>
              </p>
              <p>
                {subscription?.trialActive
                  ? "Trial ends on "
                  : isCanceled
                    ? "Access until "
                    : "Next renewal on "}
                <span className="text-white">
                  {subscription?.trialActive && subscription.trialEndsAt
                    ? formatRenewalDate(subscription.trialEndsAt)
                    : renewalDate}
                </span>
              </p>
              {isCanceled && (
                <p className="text-amber-400 text-xs">
                  Cancellation scheduled — premium access continues until the date above.
                </p>
              )}
            </div>

            {cancelMessage && (
              <p className="mt-3 text-sm text-emerald-400">{cancelMessage}</p>
            )}

            <div className="flex flex-wrap gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  if (paused) {
                    showComingSoon();
                    return;
                  }
                  onUpgradePlan?.();
                }}
                aria-disabled={paused}
                className={`${dashboard.btnPrimary} inline-flex items-center gap-2 px-5 py-2.5 text-sm ${
                  paused ? "opacity-80" : ""
                }`}
              >
                {isPaid ? "Change Plan" : "Upgrade Plan"}
                {paused ? <ComingSoonBadge /> : null}
              </button>
              {isPaid && !isCanceled && (
                <button
                  type="button"
                  onClick={() => {
                    if (paused) {
                      showComingSoon();
                      return;
                    }
                    setShowCancelConfirm(true);
                  }}
                  aria-disabled={paused}
                  className={`${dashboard.btnSecondary} inline-flex items-center gap-2 px-5 py-2.5 text-sm text-[#FCA5A5] hover:border-red-500/40 ${
                    paused ? "opacity-80" : ""
                  }`}
                >
                  Cancel Subscription
                  {paused ? <ComingSoonBadge /> : null}
                </button>
              )}
            </div>

            {isPaid && !isCanceled && (
              <p className={`mt-4 max-w-xl text-xs leading-relaxed ${dashboard.subtle}`}>
                Canceling your subscription stops future renewals only. Your
                subscription remains active until the end of your billing
                period. No refunds are issued for canceled subscriptions.
              </p>
            )}

            {showCancelConfirm && (
              <div className={`mt-4 p-4 rounded-[18px] bg-[#0A0A0A] border ${dashboard.border}`}>
                <p className={`text-sm ${dashboard.muted}`}>
                  Cancel at the end of your billing period? You will keep access until{" "}
                  <span className="text-white">{renewalDate}</span>. No refund
                  will be issued for the unused portion of this period.
                </p>
                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    disabled={canceling}
                    onClick={() => void handleCancel()}
                    className="px-4 py-2 rounded-xl bg-red-500/15 border border-red-400/30 text-red-300 text-sm font-medium hover:bg-red-500/25 disabled:opacity-50"
                  >
                    {canceling ? "Canceling…" : "Confirm Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(false)}
                    className={`${dashboard.btnSecondary} px-4 py-2 text-sm ${dashboard.subtle} hover:text-white`}
                  >
                    Keep Plan
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <AiCreditsCard
          subscription={subscription}
          loading={loading}
          detailed
          className="lg:col-span-1"
          showUpgradeLink={Boolean(onUpgradePlan)}
        />
        <div className={`${dashboard.cardLg} p-6 sm:p-8 lg:col-span-2`}>
          <h3 className="text-lg font-bold text-white mb-5">
            Usage this billing cycle
          </h3>
          <PlanUsageDisplay subscription={subscription} loading={loading} />
        </div>
      </div>

      <AiCreditUsageHistory />
    </motion.div>
  );
}
