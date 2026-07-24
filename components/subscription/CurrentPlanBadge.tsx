"use client";

import type { SubscriptionSnapshot } from "@/lib/subscription";
import {
  formatLimit,
  getPlanBadgeStyles,
  getSubscriptionStatusLabel,
  getUsagePercent,
} from "@/lib/subscription";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

type CurrentPlanBadgeProps = {
  subscription: SubscriptionSnapshot | null;
  loading?: boolean;
  compact?: boolean;
  onClick?: () => void;
};

export function CurrentPlanBadge({
  subscription,
  loading,
  compact,
  onClick,
}: CurrentPlanBadgeProps) {
  if (loading) {
    return (
      <Skeleton className="h-6 w-16 rounded-full" aria-label="Loading plan" />
    );
  }

  const planId = subscription?.planId ?? "free";
  const planName = subscription?.trialActive
    ? "Free Trial"
    : subscription?.planName ?? "Free";
  const styles = getPlanBadgeStyles(
    subscription?.trialActive ? "trial" : planId
  );
  const statusLabel = getSubscriptionStatusLabel({
    status: subscription?.status ?? "active",
    planId,
    currentPeriodEnd: subscription?.currentPeriodEnd,
    trialActive: subscription?.trialActive,
    remainingTrialDays: subscription?.remainingTrialDays,
    trialExpired: subscription?.trialExpired,
  });

  const badgeClass = cn(
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all",
    styles.badge,
    onClick &&
      "cursor-pointer hover:border-[#3B82F6]/50 hover:bg-[#3B82F6]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/40"
  );

  const content = (
    <>
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      {compact ? planName : statusLabel}
    </>
  );

  if (compact) {
    if (onClick) {
      return (
        <button
          type="button"
          onClick={onClick}
          className={badgeClass}
          aria-label={`${planName} plan details`}
        >
          {content}
        </button>
      );
    }
    return <span className={badgeClass}>{content}</span>;
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-2xl font-bold text-white">{planName}</span>
      {onClick ? (
        <button type="button" onClick={onClick} className={badgeClass}>
          <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
          {statusLabel}
        </button>
      ) : (
        <span className={badgeClass}>
          <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
          {statusLabel}
        </span>
      )}
    </div>
  );
}

type PlanUsageDisplayProps = {
  subscription: SubscriptionSnapshot | null;
  loading?: boolean;
};

export function PlanUsageDisplay({ subscription, loading }: PlanUsageDisplayProps) {
  if (loading || !subscription) {
    return (
      <div className="grid gap-6 sm:grid-cols-2" aria-busy="true">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  const allotment =
    subscription.usage.aiCreditsAllotment ??
    subscription.limits.aiActionsPerMonth;
  const remaining =
    subscription.usage.aiCreditsRemaining ??
    Math.max(0, allotment - subscription.usage.aiActionsUsed);

  const stats = [
    {
      label: "Monthly AI Credits",
      used: subscription.usage.aiActionsUsed,
      limit: allotment,
      unit: `${Number.isFinite(remaining)
        ? (subscription.usage.monthlyCreditsRemaining ?? Math.max(0, allotment - subscription.usage.aiActionsUsed)).toLocaleString("en-IN")
        : "∞"} remaining this cycle`,
    },
    {
      label: "Purchased Credits",
      used: 0,
      limit:
        (subscription.usage.purchasedCreditsRemaining ?? 0) > 0
          ? subscription.usage.purchasedCreditsRemaining!
          : 0,
      unit: `${(subscription.usage.purchasedCreditsRemaining ?? 0).toLocaleString("en-IN")} available top-up`,
      displayOnly: true as const,
    },
    {
      label: "Inboxes",
      used: subscription.usage.inboxesConnected,
      limit: subscription.limits.inboxes,
      unit: "connected",
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => {
        if ("displayOnly" in stat && stat.displayOnly) {
          return (
            <div key={stat.label}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-[#71717A]">{stat.label}</span>
                <span className="text-sm font-medium text-white tabular-nums">
                  {(subscription.usage.purchasedCreditsRemaining ?? 0).toLocaleString(
                    "en-IN"
                  )}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#0A0A0A]">
                <div
                  className="h-full rounded-full bg-[#60A5FA] transition-all duration-500"
                  style={{
                    width:
                      (subscription.usage.purchasedCreditsRemaining ?? 0) > 0
                        ? "100%"
                        : "0%",
                  }}
                />
              </div>
              <p className="mt-1.5 text-xs text-[#71717A]">{stat.unit}</p>
            </div>
          );
        }

        const percent = getUsagePercent(stat.used, stat.limit);
        const limitLabel = formatLimit(stat.limit);
        const isAtLimit = percent >= 100;
        const isWarn = percent >= 80 && percent < 100;

        return (
          <div key={stat.label}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-[#71717A]">{stat.label}</span>
              <span className="text-sm font-medium text-white">
                {stat.used.toLocaleString("en-IN")}
                <span className="text-[#71717A]"> / {limitLabel}</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#0A0A0A]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isAtLimit
                    ? "bg-[#EF4444]"
                    : isWarn
                      ? "bg-amber-400"
                      : "bg-[#3B82F6]"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-[#71717A]">{stat.unit}</p>
          </div>
        );
      })}
    </div>
  );
}

export function formatRenewalDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
