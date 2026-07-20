"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  PipelineToolbar,
  getVisibleStages,
  type PipelineFilters,
} from "@/components/crm/pipeline/PipelineToolbar";
import { PipelineColumn } from "@/components/crm/pipeline/PipelineColumn";
import {
  PipelineDealCardOverlay,
} from "@/components/crm/pipeline/PipelineDealCard";
import { PipelineDealDetailPanel } from "@/components/crm/pipeline/PipelineDealDetailPanel";
import { CrmListSkeleton } from "@/components/crm/CrmListSkeleton";
import {
  computePipelineMetrics,
  filterPipelineDeals,
  sortPipelineDeals,
  type PipelineDeal,
} from "@/lib/crm/pipeline";

const DEFAULT_FILTERS: PipelineFilters = {
  search: "",
  owner: "all",
  companyId: "all",
  priority: "all",
  stage: "all",
  aiScoreTier: "all",
  sort: "value-desc",
};

export function DealPipelineBoard() {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PipelineFilters>(DEFAULT_FILTERS);
  const [selectedDeal, setSelectedDeal] = useState<PipelineDeal | null>(null);
  const [activeDealId, setActiveDealId] = useState<string | null>(null);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/deals");
      const json = (await res.json()) as { pipelineDeals?: PipelineDeal[] };
      setDeals(json.pipelineDeals ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDeals();
  }, [loadDeals]);

  const companies = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of deals) {
      if (d.companyId) map.set(d.companyId, d.companyName);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [deals]);

  const owners = useMemo(
    () =>
      Array.from(new Set(deals.map((d) => d.owner).filter(Boolean))).sort(),
    [deals]
  );

  const filtered = useMemo(() => {
    const list = filterPipelineDeals(deals, filters);
    return sortPipelineDeals(list, filters.sort);
  }, [deals, filters]);

  const visibleStages = useMemo(
    () => getVisibleStages(filters.stage),
    [filters.stage]
  );

  const dealsByStage = useMemo(() => {
    const map = Object.fromEntries(
      visibleStages.map((s) => [s, [] as PipelineDeal[]])
    ) as Record<string, PipelineDeal[]>;
    for (const deal of filtered) {
      if (map[deal.stage]) map[deal.stage].push(deal);
    }
    return map;
  }, [filtered, visibleStages]);

  async function moveDeal(dealId: string, stage: PipelineDeal["stage"]) {
    const res = await fetch(`/api/crm/deals/${dealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    if (!res.ok) return;
    const json = (await res.json()) as {
      deal?: {
        id: string;
        stage: PipelineDeal["stage"];
        lastActivityAt: string;
      };
    };
    if (!json.deal) return;

    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? {
              ...d,
              stage: json.deal!.stage,
              lastActivity: "Just now",
            }
          : d
      )
    );
    setSelectedDeal((prev) =>
      prev?.id === dealId ? { ...prev, stage: json.deal!.stage } : prev
    );
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDealId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDealId(null);
    const dealId = event.active.id as string;
    const overId = event.over?.id as string | undefined;
    if (!overId || !visibleStages.includes(overId as PipelineDeal["stage"])) {
      return;
    }
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === overId) return;
    void moveDeal(dealId, overId as PipelineDeal["stage"]);
  }

  const activeDeal = activeDealId
    ? deals.find((d) => d.id === activeDealId)
    : null;

  const metrics = computePipelineMetrics(deals);

  if (loading) {
    return <CrmListSkeleton rows={4} />;
  }

  return (
    <div>
      <PipelineToolbar
        filters={filters}
        onChange={setFilters}
        totalDeals={deals.length}
        filteredCount={filtered.length}
        companies={companies}
        owners={owners}
      />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory premium-scrollbar">
          {visibleStages.map((stageId) => (
            <PipelineColumn
              key={stageId}
              stageId={stageId}
              deals={dealsByStage[stageId] ?? []}
              selectedDealId={selectedDeal?.id}
              onSelectDeal={setSelectedDeal}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
          {activeDeal ? <PipelineDealCardOverlay deal={activeDeal} /> : null}
        </DragOverlay>
      </DndContext>

      <PipelineDealDetailPanel
        deal={selectedDeal}
        onClose={() => setSelectedDeal(null)}
      />

      <p className="sr-only">
        Pipeline metrics: {metrics.activeDeals} active deals,{" "}
        {metrics.totalPipelineValue} total value
      </p>
    </div>
  );
}
