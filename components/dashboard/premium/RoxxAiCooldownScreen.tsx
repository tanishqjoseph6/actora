"use client";

import { motion } from "framer-motion";
import { Clock, Sparkles } from "lucide-react";
import type { RoxxFairUsageStatus } from "@/lib/assistant/fair-usage/types";
import { UpgradeButton } from "@/components/subscription/UpgradeButton";
import { formatCooldownClock } from "@/hooks/useRoxxFairUsage";
import { getPlanBadgeStyles } from "@/lib/subscription";

type RoxxAiCooldownScreenProps = {
  status: RoxxFairUsageStatus;
};

export function RoxxAiCooldownScreen({ status }: RoxxAiCooldownScreenProps) {
  const remaining = status.cooldownRemainingSeconds;
  const badge = getPlanBadgeStyles(status.planId);
  const showUpgrade = Boolean(status.upgradePlan);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-x-0 bottom-0 z-30 border-t border-[#3B82F6]/20 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/98 to-[#0A0A0A]/90 px-5 py-6 backdrop-blur-md sm:px-6"
    >
      <div className="mx-auto flex max-w-lg flex-col items-center text-center">
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#3B82F6]"
        >
          <Sparkles className="h-6 w-6" strokeWidth={1.75} />
        </motion.div>

        <h3 className="text-base font-semibold text-white sm:text-lg">
          Roxxx AI is taking a short break.
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
          You&apos;ve reached your continuous AI session limit. Please wait
          before continuing.
        </p>

        <div className="mt-5 w-full rounded-2xl border border-white/[0.08] bg-[#111111] p-4">
          <div className="flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
            <Clock className="h-3.5 w-3.5" />
            Remaining cooldown
          </div>
          <motion.p
            key={remaining}
            initial={{ opacity: 0.6, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="mt-2 font-mono text-4xl font-semibold tabular-nums tracking-tight text-white sm:text-5xl"
            aria-live="polite"
            aria-atomic="true"
          >
            {formatCooldownClock(remaining)}
          </motion.p>
          <p className="mt-3 text-xs text-[#71717A]">
            Your chat history stays available — sending resumes automatically
            when the timer ends.
          </p>
        </div>

        <div className="mt-4 inline-flex items-center gap-2">
          <span className="text-xs text-[#71717A]">Current plan</span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${badge.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
            {status.planName}
          </span>
        </div>

        {showUpgrade && status.upgradePlan ? (
          <div className="mt-5">
            <UpgradeButton
              plan={status.upgradePlan}
              showPlan
              className="!px-4 !py-2.5 !text-xs !normal-case !tracking-normal"
            />
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
