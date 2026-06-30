"use client";

import { useMemo } from "react";
import { CrmPageHeader } from "@/components/crm/CrmPageHeader";
import { CrmStatCard } from "@/components/crm/CrmStatCard";
import { CrmSubNav } from "@/components/crm/CrmSubNav";
import { PipelineBoard } from "@/components/crm/pipeline/PipelineBoard";
import { formatCurrency } from "@/lib/crm/mock-data";
import {
  computePipelineMetrics,
  MOCK_PIPELINE_DEALS,
} from "@/lib/crm/pipeline";

export default function PipelinePage() {
  const stats = useMemo(
    () => computePipelineMetrics(MOCK_PIPELINE_DEALS),
    []
  );

  return (
    <>
      <CrmPageHeader
        badge="📊 CRM · Pipeline"
        title="Sales"
        titleAccent="Pipeline"
        description="Drag deals across stages, filter your book, and track momentum from first touch to close."
      />

      <div className="mb-6">
        <CrmSubNav />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <CrmStatCard
          title="Pipeline value"
          value={formatCurrency(stats.totalPipelineValue)}
          hint="Open deals"
        />
        <CrmStatCard title="Deals won" value={stats.dealsWon} />
        <CrmStatCard title="Deals lost" value={stats.dealsLost} />
        <CrmStatCard
          title="Avg. AI score"
          value={stats.avgAiScore}
          hint="All deals"
        />
        <CrmStatCard title="Active deals" value={stats.activeDeals} />
        <CrmStatCard
          title="Win rate"
          value={`${stats.winRate}%`}
          hint="Won vs lost"
        />
      </div>

      <div className="bg-[#081226]/80 border border-cyan-400/20 rounded-3xl p-4 sm:p-6 lg:p-8 backdrop-blur-sm shadow-lg shadow-black/20">
        <PipelineBoard />
      </div>
    </>
  );
}
