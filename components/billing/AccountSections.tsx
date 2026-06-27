import { MOCK_USAGE } from "./pricing-data";

type CurrentPlanCardProps = {
  onUpgradePlan?: () => void;
};

export function CurrentPlanCard({ onUpgradePlan }: CurrentPlanCardProps) {
  return (
    <div className="rounded-2xl bg-[#081226]/80 backdrop-blur-sm border border-[rgba(0,255,255,0.15)] p-6 sm:p-8 shadow-lg shadow-black/20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">
            Current Plan
          </p>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-white">Free</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#60A5FA] text-xs font-medium">
              Active
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Renews on <span className="text-gray-300">Apr 1, 2026</span>
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

export function UsageStats() {
  const stats = [
    {
      label: "AI Actions",
      used: MOCK_USAGE.aiActions.used,
      limit: MOCK_USAGE.aiActions.limit,
      unit: "this month",
    },
    {
      label: "Inboxes",
      used: MOCK_USAGE.inboxes.used,
      limit: MOCK_USAGE.inboxes.limit,
      unit: "connected",
    },
    {
      label: "Drafts Generated",
      used: MOCK_USAGE.drafts.used,
      limit: MOCK_USAGE.drafts.limit,
      unit: "this month",
    },
  ];

  return (
    <div className="rounded-2xl bg-[#081226]/80 backdrop-blur-sm border border-[rgba(0,255,255,0.15)] p-6 sm:p-8 shadow-lg shadow-black/20">
      <h3 className="text-lg font-bold text-white mb-6">Usage This Month</h3>

      <div className="grid sm:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const percent = Math.min((stat.used / stat.limit) * 100, 100);

          return (
            <div key={stat.label}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{stat.label}</span>
                <span className="text-sm font-medium text-white">
                  {stat.used}
                  <span className="text-gray-500"> / {stat.limit}</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#0d1730] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#00CFFF] transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">{stat.unit}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
