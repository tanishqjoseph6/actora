import type { SubscriptionSnapshot } from "@/lib/subscription";
import { formatLimit, getPlanBadgeStyles, getUsagePercent } from "@/lib/subscription";

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
      <span className="inline-flex px-2.5 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-xs text-gray-500 animate-pulse">
        Loading…
      </span>
    );
  }

  const planId = subscription?.planId ?? "free";
  const planName = subscription?.planName ?? "Free";
  const styles = getPlanBadgeStyles(planId);

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
        Active
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
      <div className="grid sm:grid-cols-2 gap-6 animate-pulse">
        <div className="h-16 bg-cyan-400/10 rounded-xl" />
        <div className="h-16 bg-cyan-400/10 rounded-xl" />
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
              <span className="text-sm text-gray-400">{stat.label}</span>
              <span className="text-sm font-medium text-white">
                {stat.used}
                <span className="text-gray-500"> / {limitLabel}</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#0d1730] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isAtLimit
                    ? "bg-gradient-to-r from-amber-500 to-red-400"
                    : "bg-gradient-to-r from-[#3B82F6] to-[#00CFFF]"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">{stat.unit}</p>
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
