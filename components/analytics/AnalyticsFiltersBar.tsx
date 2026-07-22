"use client";

import { CrmFilterChips } from "@/components/crm/CrmFilterChips";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import type {
  AnalyticsFilters,
  AnalyticsMemberFilter,
  AnalyticsPeriod,
  AnalyticsWorkspaceFilter,
} from "@/lib/analytics/types";

const PERIOD_CHIPS = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "12m", label: "12 months" },
];

type AnalyticsFiltersBarProps = {
  filters: AnalyticsFilters;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  onWorkspaceChange: (workspace: AnalyticsWorkspaceFilter) => void;
  onMemberChange: (member: AnalyticsMemberFilter) => void;
};

export function AnalyticsFiltersBar({
  filters,
  onPeriodChange,
  onWorkspaceChange,
  onMemberChange,
}: AnalyticsFiltersBarProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div>
        <p className={`text-[11px] uppercase tracking-wider ${dashboard.subtle} mb-2`}>
          Date range
        </p>
        <CrmFilterChips
          chips={PERIOD_CHIPS}
          activeId={filters.period}
          onChange={(id) => onPeriodChange(id as AnalyticsPeriod)}
        />
      </div>

      <div className="flex flex-wrap gap-6">
        <div>
          <p className={`text-[11px] uppercase tracking-wider ${dashboard.subtle} mb-2`}>
            Workspace
          </p>
          <CrmFilterChips
            chips={[{ id: "my", label: "My workspace" }]}
            activeId={filters.workspace}
            onChange={(id) => onWorkspaceChange(id as AnalyticsWorkspaceFilter)}
          />
        </div>
        <div>
          <p className={`text-[11px] uppercase tracking-wider ${dashboard.subtle} mb-2`}>
            Team member
          </p>
          <CrmFilterChips
            chips={[{ id: "me", label: "Me" }]}
            activeId={filters.member}
            onChange={(id) => onMemberChange(id as AnalyticsMemberFilter)}
          />
        </div>
      </div>
    </div>
  );
}
