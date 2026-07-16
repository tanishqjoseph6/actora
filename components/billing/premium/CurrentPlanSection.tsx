"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import type { SubscriptionSnapshot } from "@/lib/subscription";
import { isPaidPlanId } from "@/lib/trial/helpers";
import {
  CurrentPlanBadge,
  formatRenewalDate,
  PlanUsageDisplay,
} from "@/components/subscription/CurrentPlanBadge";
import { Skeleton } from "@/components/ui/Skeleton";

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
      <div className="rounded-[24px] bg-[#111827]/70 border border-[#1E293B] backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-black/20">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
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
            <div className="mt-4 space-y-1.5 text-sm text-gray-400">
              <p>
                Billing cycle:{" "}
                <span className="text-gray-200">
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
                <span className="text-gray-200">
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
                onClick={onUpgradePlan}
                className="px-5 py-2.5 rounded-2xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-sm font-semibold transition-all shadow-md active:scale-[0.98]"
              >
                {isPaid ? "Change Plan" : "Upgrade Plan"}
              </button>
              {isPaid && !isCanceled && (
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="px-5 py-2.5 rounded-2xl border border-[#1E293B] text-gray-300 text-sm font-medium hover:border-red-500/40 hover:text-red-300 transition-all active:scale-[0.98]"
                >
                  Cancel Subscription
                </button>
              )}
            </div>

            {showCancelConfirm && (
              <div className="mt-4 p-4 rounded-xl bg-[#0B1220] border border-[#1E293B]">
                <p className="text-sm text-gray-300">
                  Cancel at the end of your billing period? You will keep access until{" "}
                  <span className="text-white">{renewalDate}</span>.
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
                    className="px-4 py-2 rounded-xl border border-[#1E293B] text-gray-400 text-sm hover:text-white"
                  >
                    Keep Plan
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="rounded-[24px] bg-[#111827]/70 border border-[#1E293B] backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-black/20">
        <h3 className="text-lg font-bold text-white mb-5">Usage this month</h3>
        <PlanUsageDisplay subscription={subscription} loading={loading} />
      </div>
    </motion.div>
  );
}
