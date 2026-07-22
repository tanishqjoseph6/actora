"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { AnalyticsDomainSections } from "@/components/analytics/AnalyticsDomainSections";
import { AnalyticsFiltersBar } from "@/components/analytics/AnalyticsFiltersBar";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { AnalyticsHealthScore } from "@/components/analytics/AnalyticsHealthScore";
import { AnalyticsSectionEmpty } from "@/components/analytics/AnalyticsSectionEmpty";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { PremiumMetricCard } from "@/components/dashboard/premium/PremiumMetricCard";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  formatHours,
  formatKpiCurrency,
  formatPercent,
} from "@/lib/analytics/format";
import type { StageBreakdown, TimeSeriesPoint } from "@/lib/analytics/types";
import { useAnalytics } from "@/hooks/useAnalytics";

function ChartSkeleton() {
  return <Skeleton className="h-[280px] w-full rounded-[20px]" />;
}

const AnalyticsActivityFeed = dynamic(
  () =>
    import("@/components/analytics/AnalyticsActivityFeed").then((m) => ({
      default: m.AnalyticsActivityFeed,
    })),
  { loading: () => <Skeleton className="h-64 w-full rounded-[20px]" /> }
);

const AnalyticsAreaChart = dynamic(
  () =>
    import("@/components/analytics/AnalyticsAreaChart").then((m) => ({
      default: m.AnalyticsAreaChart,
    })),
  { loading: ChartSkeleton, ssr: false }
);

const AnalyticsBarChart = dynamic(
  () =>
    import("@/components/analytics/AnalyticsBarChart").then((m) => ({
      default: m.AnalyticsBarChart,
    })),
  { loading: ChartSkeleton, ssr: false }
);

const AnalyticsLineChart = dynamic(
  () =>
    import("@/components/analytics/AnalyticsLineChart").then((m) => ({
      default: m.AnalyticsLineChart,
    })),
  { loading: ChartSkeleton, ssr: false }
);

const AnalyticsDonutChart = dynamic(
  () =>
    import("@/components/analytics/AnalyticsDonutChart").then((m) => ({
      default: m.AnalyticsDonutChart,
    })),
  { loading: ChartSkeleton, ssr: false }
);

const AnalyticsProgressRing = dynamic(
  () =>
    import("@/components/analytics/AnalyticsProgressRing").then((m) => ({
      default: m.AnalyticsProgressRing,
    })),
  { loading: () => <Skeleton className="h-40 w-full rounded-[20px]" />, ssr: false }
);

function periodSubtitle(period: string): string {
  switch (period) {
    case "7d":
      return "Last 7 days";
    case "30d":
      return "Last 30 days";
    case "90d":
      return "Last 90 days";
    case "12m":
      return "Last 12 months";
    default:
      return "";
  }
}

export default function AnalyticsPage() {
  const { snapshot, filters, setPeriod, setFilters, loading, error, refresh } =
    useAnalytics("7d");
  const { overview } = snapshot;
  const subtitle = periodSubtitle(filters.period);

  const charts = useMemo(
    () => ({
      EmailReceivedChart: ({ data }: { data: TimeSeriesPoint[] }) => (
        <AnalyticsAreaChart
          title="Emails received"
          subtitle={subtitle}
          data={data}
        />
      ),
      EmailRepliedChart: ({ data }: { data: TimeSeriesPoint[] }) => (
        <AnalyticsLineChart
          title="Emails replied"
          subtitle={subtitle}
          data={data}
        />
      ),
      AiVsManualChart: ({ data }: { data: StageBreakdown[] }) => (
        <AnalyticsDonutChart
          title="AI vs manual replies"
          subtitle="Reply method breakdown"
          data={data}
          centerLabel="replies"
        />
      ),
      EmailCategoriesChart: ({ data }: { data: StageBreakdown[] }) => (
        <AnalyticsDonutChart
          title="Top email categories"
          subtitle="By linked inbox subjects"
          data={data}
          centerLabel="emails"
        />
      ),
      ContactsGrowthChart: ({ data }: { data: TimeSeriesPoint[] }) => (
        <AnalyticsAreaChart
          title="Contacts growth"
          subtitle="Cumulative contacts"
          data={data}
        />
      ),
      DealsCreatedChart: ({ data }: { data: TimeSeriesPoint[] }) => (
        <AnalyticsBarChart
          title="Deals created"
          subtitle={subtitle}
          data={data}
        />
      ),
      PipelineStageChart: ({ data }: { data: StageBreakdown[] }) => (
        <AnalyticsDonutChart
          title="Deals by stage"
          subtitle="Current pipeline distribution"
          data={data}
          centerLabel="deals"
        />
      ),
      MeetingsTrendChart: ({ data }: { data: TimeSeriesPoint[] }) => (
        <AnalyticsBarChart
          title="Meetings over time"
          subtitle={subtitle}
          data={data}
        />
      ),
      TasksTrendChart: ({ data }: { data: TimeSeriesPoint[] }) => (
        <AnalyticsAreaChart
          title="Productivity trend"
          subtitle="Tasks completed per period"
          data={data}
        />
      ),
      AutomationRunsChart: ({ data }: { data: TimeSeriesPoint[] }) => (
        <AnalyticsBarChart
          title="Automation runs"
          subtitle={subtitle}
          data={data}
        />
      ),
      RoxxUsageChart: ({ data }: { data: TimeSeriesPoint[] }) => (
        <AnalyticsLineChart
          title="Roxx AI usage"
          subtitle={subtitle}
          data={data}
        />
      ),
    }),
    [subtitle]
  );

  return (
    <FeatureGate feature="analytics" fullPage>
      <>
        <AnalyticsHeader
          snapshot={snapshot.hasAnyData || !loading ? snapshot : null}
          onRefresh={() => void refresh()}
        />

        <AnalyticsFiltersBar
          filters={filters}
          onPeriodChange={setPeriod}
          onWorkspaceChange={(workspace) =>
            setFilters((prev) => ({ ...prev, workspace }))
          }
          onMemberChange={(member) =>
            setFilters((prev) => ({ ...prev, member }))
          }
        />

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <AnalyticsHealthScore snapshot={snapshot} loading={loading} />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 mb-6 lg:mb-8">
          <PremiumMetricCard
            title="Emails processed"
            value={overview.emailsProcessed}
            loading={loading}
            delay={0}
          />
          <PremiumMetricCard
            title="AI replies"
            value={overview.aiRepliesGenerated}
            loading={loading}
            delay={0.03}
          />
          <PremiumMetricCard
            title="Emails saved"
            value={overview.emailsSavedByAi}
            loading={loading}
            delay={0.06}
          />
          <PremiumMetricCard
            title="Contacts"
            value={overview.contacts}
            loading={loading}
            delay={0.09}
          />
          <PremiumMetricCard
            title="Companies"
            value={overview.companies}
            loading={loading}
            delay={0.12}
          />
          <PremiumMetricCard
            title="Deals"
            value={overview.deals}
            loading={loading}
            delay={0.15}
          />
          <PremiumMetricCard
            title="Meetings"
            value={overview.meetings}
            loading={loading}
            delay={0.18}
          />
          <PremiumMetricCard
            title="Tasks"
            value={overview.tasks}
            loading={loading}
            delay={0.21}
          />
          <PremiumMetricCard
            title="Automations"
            value={overview.activeAutomations}
            loading={loading}
            delay={0.24}
          />
          <PremiumMetricCard
            title="Roxx conversations"
            value={overview.roxxConversations}
            loading={loading}
            delay={0.27}
          />
          <PremiumMetricCard
            title="AI time saved"
            value={formatHours(overview.aiTimeSavedHours)}
            loading={loading}
            delay={0.3}
          />
          <PremiumMetricCard
            title="Health score"
            value={formatPercent(overview.workspaceHealthScore)}
            loading={loading}
            delay={0.33}
          />
        </div>

        {!snapshot.hasAnyData && !loading ? (
          <AnalyticsSectionEmpty
            illustration="crm"
            title="Your analytics will come alive here"
            description="Connect your inbox, add CRM records, schedule meetings, and use Roxx AI — insights appear automatically as you work."
            ctaLabel="Go to dashboard"
            ctaHref="/dashboard"
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 lg:mb-8">
              <div className={`rounded-[20px] border border-white/[0.06] bg-[#111111] p-5 flex justify-center`}>
                <AnalyticsProgressRing
                  value={snapshot.email.inboxZeroProgress}
                  label="Inbox Zero"
                  sublabel="Progress toward cleared inbox"
                />
              </div>
              <div className={`rounded-[20px] border border-white/[0.06] bg-[#111111] p-5 flex justify-center`}>
                <AnalyticsProgressRing
                  value={snapshot.crm.conversionRate}
                  label="CRM conversion"
                  sublabel="Deals won vs total"
                  color="#60A5FA"
                />
              </div>
              <div className={`rounded-[20px] border border-white/[0.06] bg-[#111111] p-5 flex justify-center`}>
                <AnalyticsProgressRing
                  value={snapshot.calendar.completionRate}
                  label="Meeting completion"
                  sublabel="Attended vs scheduled"
                  color="#2563EB"
                />
              </div>
            </div>

            <AnalyticsDomainSections snapshot={snapshot} charts={charts} />
          </>
        )}

        {snapshot.recentActivity.length > 0 && (
          <div className="mt-6 lg:mt-8">
            <AnalyticsActivityFeed items={snapshot.recentActivity} />
          </div>
        )}
      </>
    </FeatureGate>
  );
}
