"use client";

import { motion } from "framer-motion";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { UpgradeButton } from "@/components/subscription/UpgradeButton";
import {
  ComingSoonBadge,
  useBillingPause,
} from "@/components/billing/BillingPauseProvider";

type TrialExpiredPanelProps = {
  compact?: boolean;
};

export function TrialExpiredPanel({ compact = false }: TrialExpiredPanelProps) {
  const { paused, showComingSoon } = useBillingPause();

  if (compact) {
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/25 bg-rose-500/5 p-4`}
      >
        <div>
          <p className="text-sm font-medium text-white">Your trial has expired</p>
          <p className={`text-xs ${dashboard.subtle} mt-0.5`}>
            Upgrade to continue using this feature.
          </p>
        </div>
        <UpgradeButton plan="pro" showPlan />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-lg flex-col items-center justify-center px-6 py-16 text-center sm:py-24"
    >
      <div
        className={`mb-5 flex h-14 w-14 items-center justify-center rounded-xl border ${dashboard.border} ${dashboard.card}`}
      >
        <svg
          className="h-6 w-6 text-[#FCA5A5]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
          />
        </svg>
      </div>
      <h2 className={`${dashboard.pageTitle} mb-2`}>Your trial has expired</h2>
      <p className={`${dashboard.muted} mb-6 max-w-sm text-sm`}>
        Your 14-day free trial has ended. Upgrade to Pro or Team to unlock
        Inbox, CRM, Automations, and Analytics. Your data is preserved.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {paused ? (
          <button
            type="button"
            onClick={showComingSoon}
            aria-disabled="true"
            className={`${dashboard.btnPrimary} inline-flex items-center gap-2 px-5 py-3 text-sm opacity-80`}
          >
            Upgrade now
            <ComingSoonBadge />
          </button>
        ) : (
          <a
            href="/billing"
            className={`${dashboard.btnPrimary} px-5 py-3 text-sm`}
          >
            Upgrade now
          </a>
        )}
        <UpgradeButton plan="pro" showPlan />
      </div>
    </motion.div>
  );
}
