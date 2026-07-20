"use client";

import { useMemo, useState, useCallback } from "react";
import { CrmPageHeader } from "@/components/crm/CrmPageHeader";
import { CrmStatCard } from "@/components/crm/CrmStatCard";
import { CrmSubNav } from "@/components/crm/CrmSubNav";
import { DealPipelineBoard } from "@/components/crm/pipeline/DealPipelineBoard";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import {
  computePipelineMetrics,
  type PipelineDeal,
} from "@/lib/crm/pipeline";
import { formatCurrency } from "@/lib/crm/mock-data";

export default function PipelinePage() {
  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const handleDealsChange = useCallback((next: PipelineDeal[]) => {
    setDeals(next);
  }, []);

  const stats = useMemo(() => computePipelineMetrics(deals), [deals]);

  return (
    <FeatureGate feature="full_crm" fullPage>
      <>
        <CrmPageHeader
          badge="CRM · Pipeline"
          title="Deal"
          titleAccent="Pipeline"
          description="Drag deals across stages and keep your revenue forecast current."
        />

        <div className="mb-6">
          <CrmSubNav />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
          <CrmStatCard title="Active deals" value={stats.activeDeals} />
          <CrmStatCard
            title="Open pipeline"
            value={formatCurrency(stats.totalPipelineValue)}
          />
          <CrmStatCard title="Won" value={stats.dealsWon} />
          <CrmStatCard title="Avg. AI score" value={stats.avgAiScore} />
        </div>

        <div className={`${dashboard.panelLg}`}>
          <DealPipelineBoard onDealsChange={handleDealsChange} />
        </div>
      </>
    </FeatureGate>
  );
}
