"use client";

import { useEffect, useMemo, useState } from "react";
import { CrmFilterChips } from "@/components/crm/CrmFilterChips";
import { AnalyticsActivityFeed } from "@/components/analytics/AnalyticsActivityFeed";
import { AnalyticsAreaChart } from "@/components/analytics/AnalyticsAreaChart";
import { AnalyticsBarChart } from "@/components/analytics/AnalyticsBarChart";
import { AnalyticsDonutChart } from "@/components/analytics/AnalyticsDonutChart";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { PremiumMetricCard } from "@/components/dashboard/premium/PremiumMetricCard";
import { formatKpiCurrency, getAnalyticsSnapshot } from "@/lib/analytics/mock-data";
import type { AnalyticsPeriod } from "@/lib/analytics/types";

const PERIOD_CHIPS = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<AnalyticsPeriod>("7d");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const snapshot = useMemo(() => getAnalyticsSnapshot(period), [period]);
  const { kpis } = snapshot;

  return (
    <>
      <AnalyticsHeader />

      <div className="mb-6">
        <CrmFilterChips
          chips={PERIOD_CHIPS}
          activeId={period}
          onChange={(id) => setPeriod(id as AnalyticsPeriod)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <PremiumMetricCard
          title="Pipeline"
          value={formatKpiCurrency(kpis.pipelineValue)}
          trend={14}
          sparkline={[280, 310, 295, 330, 348, 365, 384]}
          loading={loading}
          delay={0}
        />
        <PremiumMetricCard
          title="Win rate"
          value={`${kpis.winRate}%`}
          trend={6}
          sparkline={[42, 45, 44, 48, 50, 52, kpis.winRate]}
          loading={loading}
          delay={0.04}
        />
        <PremiumMetricCard
          title="Active deals"
          value={kpis.activeDeals}
          trend={8}
          loading={loading}
          delay={0.08}
        />
        <PremiumMetricCard
          title="Emails"
          value={kpis.emailsProcessed}
          trend={11}
          sparkline={[38, 52, 48, 61, 58, 70, 73]}
          loading={loading}
          delay={0.12}
        />
        <PremiumMetricCard
          title="AI actions"
          value={kpis.aiActions}
          trend={18}
          sparkline={[8, 12, 10, 15, 18, 22, 26]}
          loading={loading}
          delay={0.16}
        />
        <PremiumMetricCard
          title="Avg. AI score"
          value={kpis.avgAiScore}
          trend={4}
          sparkline={[62, 64, 63, 66, 68, 69, kpis.avgAiScore]}
          loading={loading}
          delay={0.2}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <AnalyticsAreaChart
          title="Pipeline value"
          subtitle={`Trend over ${period === "7d" ? "the last 7 days" : period === "30d" ? "4 weeks" : "6 months"}`}
          data={snapshot.pipelineTrend}
          formatValue={formatKpiCurrency}
        />
        <AnalyticsBarChart
          title="Email volume"
          subtitle="Messages processed per period"
          data={snapshot.emailVolume}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <AnalyticsAreaChart
          title="AI usage"
          subtitle="Automations, replies, and summaries"
          data={snapshot.aiUsage}
        />
        <AnalyticsDonutChart
          title="Deals by stage"
          subtitle="Current pipeline distribution"
          data={snapshot.pipelineByStage}
        />
      </div>

      <AnalyticsActivityFeed items={snapshot.recentActivity} />
    </>
  );
}
