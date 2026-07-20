"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import {
  ComingSoonBadge,
  useBillingPause,
} from "@/components/billing/BillingPauseProvider";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

const DISMISS_KEY = "actora_trial_banner_dismissed";

export function TrialBanner() {
  const { subscription, loading } = usePlanGate();
  const { paused, showComingSoon } = useBillingPause();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const endsAt = subscription?.trialEndsAt ?? "";
    const key = `${DISMISS_KEY}:${endsAt}`;
    setDismissed(window.sessionStorage.getItem(key) === "1");
  }, [subscription?.trialEndsAt]);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined" && subscription?.trialEndsAt) {
      window.sessionStorage.setItem(
        `${DISMISS_KEY}:${subscription.trialEndsAt}`,
        "1"
      );
    }
    setDismissed(true);
  }, [subscription?.trialEndsAt]);

  if (loading || !subscription?.trialActive || dismissed) {
    return null;
  }

  const days = subscription.remainingTrialDays;
  const progress = subscription.trialProgressPercent;
  const expiryLabel = subscription.trialEndsAt
    ? new Date(subscription.trialEndsAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="relative mb-6 overflow-hidden rounded-[18px] border border-[#3B82F6]/35 bg-[#111111] p-4 sm:p-5"
      >
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              You&apos;re currently using Actora Free Trial.
            </p>
            <p className={`mt-1 text-sm ${dashboard.muted}`}>
              {days} day{days === 1 ? "" : "s"} remaining
              {expiryLabel ? ` · ends ${expiryLabel}` : ""}. Upgrade anytime.
            </p>
            <div className="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full bg-[#3B82F6]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {paused ? (
              <button
                type="button"
                onClick={showComingSoon}
                aria-disabled="true"
                className={`${dashboard.btnPrimary} inline-flex items-center gap-2 px-4 py-2 text-sm opacity-80`}
              >
                Upgrade
                <ComingSoonBadge />
              </button>
            ) : (
              <a
                href="/billing"
                className={`${dashboard.btnPrimary} px-4 py-2 text-sm`}
              >
                Upgrade
              </a>
            )}
            <button
              type="button"
              onClick={dismiss}
              className={`${dashboard.btnSecondary} px-3 py-2 text-xs`}
              aria-label="Dismiss trial banner"
            >
              Dismiss
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
