"use client";

import type { SubscriptionSnapshot } from "@/lib/subscription";
import {
  formatLimit,
  getPlanDisplayName,
  getSubscriptionStatusLabel,
  getUsagePercent,
} from "@/lib/subscription";
import { computeCreditBalance } from "@/lib/ai-credits/balance";
import { formatCredits, formatNextResetDate } from "@/lib/ai-credits/format";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

type BillingOverviewSectionProps = {
  subscription: SubscriptionSnapshot | null;
  loading?: boolean;
};

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className={`${dashboard.cardBase} p-4 sm:p-5`}>
      <p className={`text-[11px] uppercase tracking-wider ${dashboard.subtle}`}>
        {label}
      </p>
      <p className="mt-2 text-xl font-bold tabular-nums text-white sm:text-2xl">
        {value}
      </p>
      {hint ? (
        <p className={`mt-1 text-xs ${dashboard.muted}`}>{hint}</p>
      ) : null}
    </div>
  );
}

export function BillingOverviewSection({
  subscription,
  loading,
}: BillingOverviewSectionProps) {
  if (loading || !subscription) {
    return (
      <section aria-busy="true" className="mb-10 space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-16 w-full rounded-2xl" />
      </section>
    );
  }

  const allotment =
    subscription.usage.aiCreditsAllotment ??
    subscription.limits.aiActionsPerMonth;
  const balance = computeCreditBalance(
    subscription.usage.aiActionsUsed,
    allotment
  );
  const remaining =
    subscription.usage.aiCreditsRemaining ?? balance.remaining;
  const monthlyRemaining =
    subscription.usage.monthlyCreditsRemaining ??
    Math.max(0, allotment - subscription.usage.aiActionsUsed);
  const purchasedRemaining =
    subscription.usage.purchasedCreditsRemaining ?? 0;
  const nextReset = formatNextResetDate(
    subscription.usage.periodEnd ?? subscription.currentPeriodEnd
  );
  const planName = subscription.trialActive
    ? "Free Trial"
    : getPlanDisplayName(subscription.planId);
  const statusHint = getSubscriptionStatusLabel({
    status: subscription.status,
    planId: subscription.planId,
    currentPeriodEnd: subscription.currentPeriodEnd,
    trialActive: subscription.trialActive,
    remainingTrialDays: subscription.remainingTrialDays,
    trialExpired: subscription.trialExpired,
  });
  const isTeam = subscription.planId === "starter";
  const percent = getUsagePercent(balance.used, balance.allotment);

  const barColor =
    balance.warning === "exhausted"
      ? "bg-[#EF4444]"
      : balance.warning === "critical_10"
        ? "bg-amber-400"
        : balance.warning === "low_20"
          ? "bg-amber-500"
          : "bg-[#3B82F6]";

  return (
    <section id="billing-overview" className="mb-10 scroll-mt-24">
      <div className="mb-5">
        <p className={`text-sm font-medium ${dashboard.accent}`}>Overview</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
          Billing overview
        </h2>
        <p className={`mt-1 text-sm ${dashboard.muted}`}>
          Your current plan, credit balance, and reset schedule.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Current plan" value={planName} hint={statusHint} />
        <StatCard
          label="AI credits remaining"
          value={
            balance.unlimited
              ? "Unlimited"
              : formatCredits(remaining as number)
          }
          hint="Monthly + purchased"
        />
        <StatCard
          label="Monthly credits"
          value={
            balance.unlimited
              ? "Unlimited"
              : `${formatCredits(monthlyRemaining as number)} / ${formatLimit(allotment)}`
          }
          hint="Resets each billing cycle"
        />
        <StatCard
          label="Next reset date"
          value={nextReset}
          hint={
            isTeam
              ? "Shared across workspace members"
              : "When monthly credits renew"
          }
        />
      </div>

      {isTeam && (
        <div className={`${dashboard.cardBase} mt-3 p-4 sm:p-5`}>
          <p className={`text-[11px] uppercase tracking-wider ${dashboard.subtle}`}>
            Workspace credits (Team)
          </p>
          <p className="mt-2 text-xl font-bold tabular-nums text-white">
            {formatCredits(remaining as number)} shared remaining
          </p>
          <p className={`mt-1 text-xs ${dashboard.muted}`}>
            Team plans share {formatLimit(allotment)} monthly credits across the
            workspace. Purchased top-ups ({formatCredits(purchasedRemaining)})
            stack on top.
          </p>
        </div>
      )}

      {!balance.unlimited && (
        <div className={`${dashboard.cardLg} mt-4 p-4 sm:p-5`}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-white">Credit usage</p>
            <p className={`text-xs tabular-nums ${dashboard.subtle}`}>
              {formatCredits(balance.used)} used · {Math.round(percent)}%
            </p>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#0A0A0A]">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                barColor
              )}
              style={{ width: `${percent}%` }}
              role="progressbar"
              aria-valuenow={Math.round(percent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Credit usage"
            />
          </div>
          <p className={`mt-2 text-xs ${dashboard.muted}`}>
            Purchased credits available: {formatCredits(purchasedRemaining)}
          </p>
        </div>
      )}
    </section>
  );
}
