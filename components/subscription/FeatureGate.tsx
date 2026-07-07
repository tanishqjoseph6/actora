"use client";

import type { ReactNode } from "react";
import { DashboardPageSkeleton } from "@/components/ui/DashboardPageSkeleton";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import {
  FEATURE_META,
  getPlanDisplayName,
  type PlanFeature,
} from "@/lib/subscription";
import { UpgradeButton } from "./UpgradeButton";
import { usePlanGate } from "./PlanGateProvider";

type LockedFeaturePanelProps = {
  feature: PlanFeature;
  compact?: boolean;
};

export function LockedFeaturePanel({
  feature,
  compact = false,
}: LockedFeaturePanelProps) {
  const { subscription } = usePlanGate();
  const meta = FEATURE_META[feature];
  const recommendedPlan = meta.teamOnly ? "starter" : "pro";

  if (compact) {
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border ${dashboard.border} ${dashboard.surface}`}
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{meta.label}</p>
          <p className={`text-xs ${dashboard.subtle} mt-0.5`}>
            Available on {getPlanDisplayName(recommendedPlan)} plan
          </p>
        </div>
        <UpgradeButton plan={recommendedPlan} showPlan />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 px-6 text-center max-w-lg mx-auto">
      <div
        className={`w-14 h-14 rounded-xl ${dashboard.card} border ${dashboard.border} flex items-center justify-center mb-5`}
      >
        <LockIcon className="w-6 h-6 text-[#64748B]" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-2">
        {getPlanDisplayName(subscription?.planId ?? "free")} plan
      </p>
      <h2 className={`${dashboard.pageTitle} mb-2`}>{meta.label}</h2>
      <p className={`${dashboard.muted} text-sm mb-6 max-w-sm`}>
        {meta.description}
      </p>
      <UpgradeButton
        plan={recommendedPlan}
        showPlan
        className="px-4 py-2 text-xs normal-case tracking-normal"
      />
    </div>
  );
}

type FeatureGateProps = {
  feature: PlanFeature;
  children: ReactNode;
  /** Replace entire page content when locked */
  fullPage?: boolean;
  compact?: boolean;
};

export function FeatureGate({
  feature,
  children,
  fullPage = false,
  compact = false,
}: FeatureGateProps) {
  const { subscription, loading, canAccessFeature } = usePlanGate();

  if (loading) {
    return fullPage ? (
      <DashboardPageSkeleton statCards={4} rows={4} />
    ) : null;
  }

  const planId = subscription?.planId ?? "free";
  if (canAccessFeature(feature, planId)) {
    return children;
  }

  return (
    <LockedFeaturePanel feature={feature} compact={compact && !fullPage} />
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}
