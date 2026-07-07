"use client";

import { motion } from "framer-motion";
import type { SubscriptionSnapshot } from "@/lib/subscription";
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
};

export function CurrentPlanSection({
  subscription,
  loading,
  onUpgradePlan,
}: CurrentPlanSectionProps) {
  const renewalDate = subscription
    ? formatRenewalDate(subscription.currentPeriodEnd)
    : "—";

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
        <p className="text-sm text-gray-400 mt-3">
          Renews on <span className="text-gray-200">{renewalDate}</span>
        </p>

        <div className="flex flex-wrap gap-3 mt-6">
          <button
            type="button"
            onClick={onUpgradePlan}
            className="px-5 py-2.5 rounded-2xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-sm font-semibold hover:bg-[#1D4ED8] transition-all shadow-md  active:scale-[0.98]"
          >
            Upgrade Plan
          </button>
          <button
            type="button"
            className="px-5 py-2.5 rounded-2xl border border-[#1E293B] text-gray-300 text-sm font-medium hover:border-[#1E293B] hover:text-white transition-all active:scale-[0.98]"
          >
            Manage Subscription
          </button>
        </div>
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
