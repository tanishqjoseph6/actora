"use client";

import Link from "next/link";
import type { SubscriptionSnapshot } from "@/lib/subscription";
import { formatLimit, getUsagePercent, isUnlimited } from "@/lib/subscription";
import { computeCreditBalance } from "@/lib/ai-credits/balance";
import { formatCredits, formatNextResetDate } from "@/lib/ai-credits/format";
import { Skeleton } from "@/components/ui/Skeleton";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { cn } from "@/lib/utils";

type AiCreditsCardProps = {
  subscription: SubscriptionSnapshot | null;
  loading?: boolean;
  compact?: boolean;
  detailed?: boolean;
  className?: string;
  showUpgradeLink?: boolean;
};

function resolveBalance(subscription: SubscriptionSnapshot | null) {
  if (!subscription) {
    return computeCreditBalance(0, 100);
  }
  const allotment =
    subscription.usage.aiCreditsAllotment ??
    subscription.limits.aiActionsPerMonth;
  return computeCreditBalance(subscription.usage.aiActionsUsed, allotment);
}

function StatRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className={dashboard.subtle}>{label}</span>
      <span
        className={cn(
          "tabular-nums",
          emphasize ? "font-semibold text-white" : "text-[#A1A1AA]"
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function AiCreditsCard({
  subscription,
  loading,
  compact,
  detailed = false,
  className,
  showUpgradeLink = true,
}: AiCreditsCardProps) {
  if (loading || !subscription) {
    return (
      <div
        className={cn(dashboard.cardLg, "p-4 sm:p-5", className)}
        aria-busy="true"
      >
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-8 w-24" />
        <Skeleton className="mt-4 h-2 w-full rounded-full" />
      </div>
    );
  }

  const balance = resolveBalance(subscription);
  const percent = getUsagePercent(balance.used, balance.allotment);
  const remaining =
    subscription.usage.aiCreditsRemaining ?? balance.remaining;
  const monthlyRemaining =
    subscription.usage.monthlyCreditsRemaining ?? balance.remaining;
  const purchasedRemaining =
    subscription.usage.purchasedCreditsRemaining ?? 0;
  const totalMonthly =
    subscription.usage.aiCreditsAllotment ??
    subscription.limits.aiActionsPerMonth;
  const nextReset = formatNextResetDate(subscription.usage.periodEnd);

  const barColor =
    balance.warning === "exhausted"
      ? "bg-[#EF4444]"
      : balance.warning === "critical_10"
        ? "bg-amber-400"
        : balance.warning === "low_20"
          ? "bg-amber-500"
          : "bg-[#3B82F6]";

  return (
    <div className={cn(dashboard.cardLg, "p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={`text-[11px] uppercase tracking-wider ${dashboard.subtle}`}>
            AI Credits
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-white">
            {balance.unlimited ? "Unlimited" : formatCredits(remaining as number)}
            {!balance.unlimited && (
              <span className={`ml-1 text-sm font-medium ${dashboard.subtle}`}>
                remaining
              </span>
            )}
          </p>
        </div>
        {!compact && showUpgradeLink && !balance.unlimited && (
          <Link
            href="/billing#ai-credits"
            scroll={false}
            className="shrink-0 text-xs font-medium text-[#3B82F6] hover:text-[#93C5FD]"
          >
            Buy credits
          </Link>
        )}
      </div>

      {(detailed || !compact) && !balance.unlimited && (
        <div className="mt-4 space-y-2 rounded-xl border border-white/[0.06] bg-[#0A0A0A]/80 p-3">
          <StatRow
            label="Remaining credits"
            value={formatCredits(remaining as number)}
            emphasize
          />
          <StatRow label="Used credits" value={formatCredits(balance.used)} />
          <StatRow
            label="Total monthly credits"
            value={formatCredits(totalMonthly as number)}
          />
          <StatRow
            label="Purchased credits"
            value={formatCredits(purchasedRemaining)}
          />
          <StatRow label="Next reset date" value={nextReset} />
        </div>
      )}

      {compact && !detailed && !balance.unlimited && (
        <div className={`mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] ${dashboard.subtle}`}>
          <span>Monthly: {formatCredits(monthlyRemaining as number)}</span>
          <span>Purchased: {formatCredits(purchasedRemaining)}</span>
        </div>
      )}

      {!balance.unlimited && (
        <>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#0A0A0A]">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                barColor
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-[#71717A]">
            <span>
              {formatCredits(balance.used)} used of {formatLimit(balance.allotment)}
            </span>
            <span>{Math.round(balance.percentUsed)}% used</span>
          </div>
        </>
      )}

      {balance.warning !== "none" && !compact && (
        <p
          className={cn(
            "mt-3 text-xs leading-relaxed",
            balance.warning === "exhausted"
              ? "text-red-300"
              : "text-amber-200/90"
          )}
        >
          {balance.warning === "exhausted"
            ? "Monthly AI credits exhausted. Buy more credits or upgrade to keep Roxx AI running."
            : balance.warning === "critical_10"
              ? "Only 10% of your monthly AI credits remain this billing cycle."
              : "You're down to 20% of your monthly AI credits for this cycle."}
        </p>
      )}
    </div>
  );
}

type AiCreditWarningBannerProps = {
  subscription: SubscriptionSnapshot | null;
};

export function AiCreditWarningBanner({
  subscription,
}: AiCreditWarningBannerProps) {
  if (!subscription) return null;
  const balance = resolveBalance(subscription);
  if (balance.warning === "none" || isUnlimited(balance.allotment)) return null;

  const styles =
    balance.warning === "exhausted"
      ? "border-red-500/30 bg-red-500/10 text-red-200"
      : "border-amber-500/30 bg-amber-500/10 text-amber-100";

  return (
    <div
      className={cn(
        "mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
        styles
      )}
      role="status"
    >
      <p>
        {balance.warning === "exhausted"
          ? "Monthly AI credits exhausted — purchase top-ups or upgrade to continue."
          : balance.warning === "critical_10"
            ? `Critical: ${formatCredits(balance.remaining)} AI credits remaining (≤10%).`
            : `Warning: ${formatCredits(balance.remaining)} AI credits remaining (≤20%).`}
      </p>
      <Link
        href="/billing#ai-credits"
        scroll={false}
        className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15"
      >
        Buy credits
      </Link>
    </div>
  );
}
