"use client";

import { useMemo } from "react";
import { CrmPageHeader } from "@/components/crm/CrmPageHeader";
import { CrmStatCard } from "@/components/crm/CrmStatCard";
import { CrmSubNav } from "@/components/crm/CrmSubNav";
import { PipelineBoard } from "@/components/crm/pipeline/PipelineBoard";
import { formatCurrency } from "@/lib/crm/mock-data";
import { MOCK_PIPELINE_DEALS } from "@/lib/crm/pipeline";

export default function PipelinePage() {
  const stats = useMemo(() => {
    const open = MOCK_PIPELINE_DEALS.filter(
      (d) => d.stage !== "won" && d.stage !== "lost"
    );
    const openValue = open.reduce((s, d) => s + d.value, 0);
    const won = MOCK_PIPELINE_DEALS.filter((d) => d.stage === "won").length;
    const avgScore = Math.round(
      MOCK_PIPELINE_DEALS.reduce((s, d) => s + d.aiScore, 0) /
        MOCK_PIPELINE_DEALS.length
    );
    return { openCount: open.length, openValue, won, avgScore };
  }, []);

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <CrmStatCard title="Open deals" value={stats.openCount} />
        <CrmStatCard
          title="Pipeline value"
          value={formatCurrency(stats.openValue)}
        />
        <CrmStatCard title="Won this quarter" value={stats.won} />
        <CrmStatCard
          title="Avg. AI score"
          value={stats.avgScore}
          hint="Win probability"
        />
      </div>

      <div className="bg-[#081226]/80 border border-cyan-400/20 rounded-3xl p-4 sm:p-6 lg:p-8 backdrop-blur-sm shadow-lg shadow-black/20">
        <PipelineBoard />
      </div>
    </>
  );
}
