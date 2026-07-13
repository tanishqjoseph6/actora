"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { SubscriptionSnapshot } from "@/lib/subscription";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

type TrialBillingCardProps = {
  subscription: SubscriptionSnapshot;
};

export function TrialBillingCard({ subscription }: TrialBillingCardProps) {
  const days = subscription.remainingTrialDays;
  const progress = subscription.trialProgressPercent;
  const expired = subscription.trialExpired && !subscription.trialActive;
  const expiryLabel = subscription.trialEndsAt
    ? new Date(subscription.trialEndsAt).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-10 overflow-hidden rounded-2xl border ${
        expired
          ? "border-rose-500/30 bg-rose-500/5"
          : "border-[#2563EB]/35 bg-gradient-to-br from-[#0B1220] to-[#111827]"
      } p-6 sm:p-8`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6]">
        {expired ? "Trial ended" : "Free trial"}
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
        {expired
          ? "Your trial has expired"
          : "You're currently on a 14-Day Free Trial"}
      </h2>
      <p className={`mt-2 max-w-xl text-sm ${dashboard.muted}`}>
        {expired
          ? "Upgrade to Starter, Pro, or Team to unlock inbox, CRM, automations, and analytics again. Your data is safe."
          : "Full access to Actora Pro features — no credit card required. Upgrade anytime to keep everything unlocked."}
      </p>

      {!expired && (
        <div className="mt-6 max-w-md">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-white font-medium">
              {days} day{days === 1 ? "" : "s"} remaining
            </span>
            {expiryLabel && (
              <span className={dashboard.subtle}>Ends {expiryLabel}</span>
            )}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#1E293B]">
            <motion.div
              className="h-full rounded-full bg-[#3B82F6]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {expired && (
        <div className="mt-6">
          <Link
            href="#pricing"
            className={`${dashboard.btnPrimary} inline-flex px-5 py-3 text-sm`}
          >
            Choose a plan
          </Link>
        </div>
      )}
    </motion.div>
  );
}
