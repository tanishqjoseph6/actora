"use client";

import {
  ComingSoonBadge,
  useBillingPause,
} from "@/components/billing/BillingPauseProvider";
import type { PlanId } from "@/lib/subscription";
import { getPlanDisplayName } from "@/lib/subscription";

type UpgradeButtonProps = {
  plan?: PlanId;
  /** Show plan name in label, e.g. "Upgrade to Pro" */
  showPlan?: boolean;
  className?: string;
};

export function UpgradeButton({
  plan = "pro",
  showPlan = false,
  className = "",
}: UpgradeButtonProps) {
  const { paused, showComingSoon } = useBillingPause();
  const label = showPlan
    ? `Upgrade to ${getPlanDisplayName(plan)}`
    : "Upgrade";

  if (paused) {
    return (
      <button
        type="button"
        onClick={showComingSoon}
        aria-disabled="true"
        className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-[#3B82F6]/10 border border-[#3B82F6]/25 text-[#93C5FD]/80 opacity-80 hover:opacity-100 transition-opacity shrink-0 ${className}`.trim()}
      >
        {label}
        <ComingSoonBadge />
      </button>
    );
  }

  return (
    <a
      href={`/billing?plan=${plan}`}
      className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-[#3B82F6]/15 border border-[#3B82F6]/35 text-[#93C5FD] hover:bg-[#3B82F6]/25 hover:border-[#3B82F6]/50 transition-colors shrink-0 ${className}`.trim()}
    >
      {label}
    </a>
  );
}
