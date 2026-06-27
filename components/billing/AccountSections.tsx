import type { SubscriptionSnapshot } from "@/lib/subscription";
import {
  CurrentPlanBadge,
  formatRenewalDate,
  PlanUsageDisplay,
} from "@/components/subscription/CurrentPlanBadge";

type CurrentPlanCardProps = {
  subscription: SubscriptionSnapshot | null;
  loading?: boolean;
  onUpgradePlan?: () => void;
};

export function CurrentPlanCard({
  subscription,
  loading,
  onUpgradePlan,
}: CurrentPlanCardProps) {
  const renewalDate = subscription
    ? formatRenewalDate(subscription.currentPeriodEnd)
    : "—";

  return (
    <div className="rounded-2xl bg-[#081226]/80 backdrop-blur-sm border border-[rgba(0,255,255,0.15)] p-6 sm:p-8 shadow-lg shadow-black/20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">
            Current Plan
          </p>
          <CurrentPlanBadge subscription={subscription} loading={loading} />
          <p className="text-sm text-gray-400 mt-2">
            Renews on{" "}
            <span className="text-gray-300">{renewalDate}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={onUpgradePlan}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#00CFFF] text-[#050816] text-sm font-semibold hover:brightness-110 transition-all duration-300 shadow-md shadow-cyan-500/20 active:scale-[0.98]"
          >
            Upgrade Plan
          </button>
          <button className="px-5 py-2.5 rounded-xl border border-[rgba(0,255,255,0.15)] text-gray-300 text-sm font-medium hover:border-[#00CFFF]/30 hover:text-white transition-all duration-300 active:scale-[0.98]">
            Manage Subscription
          </button>
        </div>
      </div>
    </div>
  );
}

type UsageStatsProps = {
  subscription: SubscriptionSnapshot | null;
  loading?: boolean;
};

export function UsageStats({ subscription, loading }: UsageStatsProps) {
  return (
    <div className="rounded-2xl bg-[#081226]/80 backdrop-blur-sm border border-[rgba(0,255,255,0.15)] p-6 sm:p-8 shadow-lg shadow-black/20">
      <h3 className="text-lg font-bold text-white mb-6">Usage This Month</h3>
      <PlanUsageDisplay subscription={subscription} loading={loading} />
    </div>
  );
}
