import type { SubscriptionSnapshot } from "@/lib/subscription";
import { formatLimit, getPlanBadgeStyles, getUsagePercent } from "@/lib/subscription";
import { Skeleton } from "@/components/ui/Skeleton";

type CurrentPlanBadgeProps = {
  subscription: SubscriptionSnapshot | null;
  loading?: boolean;
  compact?: boolean;
};

export function CurrentPlanBadge({
  subscription,
  loading,
  compact,
}: CurrentPlanBadgeProps) {
  if (loading) {
    return (
      <Skeleton className="h-6 w-16 rounded-full" aria-label="Loading plan" />
    );
  }

  const planId = subscription?.planId ?? "free";
  const planName = subscription?.planName ?? "Free";
  const styles = getPlanBadgeStyles(planId);
  const statusLabel = subscription?.trialActive
    ? `${subscription.remainingTrialDays}d left`
    : subscription?.trialExpired
      ? "Expired"
      : "Active";

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-medium ${styles.badge}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
        {planName}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-2xl font-bold text-white">{planName}</span>
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-medium ${styles.badge}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
        {statusLabel}
      </span>
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
      <div className="grid sm:grid-cols-2 gap-6" aria-busy="true">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  const stats = [
    {
      label: "AI Actions",
      used: subscription.usage.aiActionsUsed,
      limit: subscription.limits.aiActionsPerMonth,
      unit: "this month",
    },
    {
      label: "Inboxes",
      used: subscription.usage.inboxesConnected,
      limit: subscription.limits.inboxes,
      unit: "connected",
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 gap-6">
      {stats.map((stat) => {
        const percent = getUsagePercent(stat.used, stat.limit);
        const limitLabel = formatLimit(stat.limit);
        const isAtLimit = percent >= 100;

        return (
          <div key={stat.label}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#64748B]">{stat.label}</span>
              <span className="text-sm font-medium text-white">
                {stat.used}
                <span className="text-[#64748B]"> / {limitLabel}</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#0B1220] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isAtLimit ? "bg-[#EF4444]" : "bg-[#2563EB]"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-xs text-[#64748B] mt-1.5">{stat.unit}</p>
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
