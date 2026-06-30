"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { getAvatarGradient, getInitials } from "@/lib/avatar";
import { formatCurrency, formatDate } from "@/lib/crm/mock-data";
import {
  MOCK_PIPELINE_DEALS,
  PIPELINE_STAGES,
  filterPipelineDeals,
  getAiScoreTier,
  PRIORITY_STYLES,
  sortPipelineDeals,
  type PipelineDeal,
} from "@/lib/crm/pipeline";
import type { DealStage } from "@/lib/crm/types";
import { PipelineColumn } from "./PipelineColumn";
import { PipelineBoardEmpty } from "./PipelineEmptyState";
import {
  PipelineToolbar,
  getVisibleStages,
  type PipelineFilters,
} from "./PipelineToolbar";

const DEFAULT_FILTERS: PipelineFilters = {
  search: "",
  owner: "all",
  companyId: "all",
  priority: "all",
  stage: "all",
  aiScoreTier: "all",
  sort: "value-desc",
};

export function PipelineBoard() {
  const [deals, setDeals] = useState<PipelineDeal[]>(MOCK_PIPELINE_DEALS);
  const [filters, setFilters] = useState<PipelineFilters>(DEFAULT_FILTERS);
  const [activeDeal, setActiveDeal] = useState<PipelineDeal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredDeals = useMemo(() => {
    const filtered = filterPipelineDeals(deals, filters);
    return sortPipelineDeals(filtered, filters.sort);
  }, [deals, filters]);

  const visibleStages = useMemo(
    () => getVisibleStages(filters.stage),
    [filters.stage]
  );

  const dealsByStage = useMemo(() => {
    const map = Object.fromEntries(
      PIPELINE_STAGES.map((s) => [s.id, [] as PipelineDeal[]])
    ) as Record<DealStage, PipelineDeal[]>;
    for (const deal of filteredDeals) {
      map[deal.stage].push(deal);
    }
    return map;
  }, [filteredDeals]);

  const hasAnyDeals = filteredDeals.length > 0;

  function handleDragStart(event: DragStartEvent) {
    const deal = deals.find((d) => d.id === event.active.id);
    if (deal) setActiveDeal(deal);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const dealId = active.id as string;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    let targetStage: DealStage | null = null;

    if (PIPELINE_STAGES.some((s) => s.id === over.id)) {
      targetStage = over.id as DealStage;
    } else {
      const overDeal = deals.find((d) => d.id === over.id);
      if (overDeal) targetStage = overDeal.stage;
    }

    if (!targetStage || targetStage === deal.stage) return;

    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: targetStage! } : d))
    );
  }

  return (
    <>
      <PipelineToolbar
        filters={filters}
        onChange={setFilters}
        totalDeals={deals.length}
        filteredCount={filteredDeals.length}
      />

      {!hasAnyDeals ? (
        <PipelineBoardEmpty />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="overflow-x-auto pb-4 -mx-2 px-2"
          >
            <div className="flex gap-4 min-w-max">
              {visibleStages.map((stageId) => (
                <PipelineColumn
                  key={stageId}
                  stageId={stageId}
                  deals={dealsByStage[stageId]}
                />
              ))}
            </div>
          </motion.div>

          <DragOverlay dropAnimation={{ duration: 220, easing: "ease" }}>
            {activeDeal ? <DragOverlayCard deal={activeDeal} /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </>
  );
}

function DragOverlayCard({ deal }: { deal: PipelineDeal }) {
  const priorityStyle = PRIORITY_STYLES[deal.priority];
  const aiTier = getAiScoreTier(deal.aiScore);

  return (
    <div className="rounded-2xl border border-cyan-400/40 bg-[#0d1730]/95 backdrop-blur-xl p-4 shadow-2xl shadow-cyan-500/20 w-[280px] rotate-1 cursor-grabbing">
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarGradient(deal.companyName)} flex items-center justify-center text-xs font-bold text-white shrink-0`}
        >
          {getInitials(deal.companyName)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-sm truncate">
            {deal.companyName}
          </h3>
          <p className="text-xs text-gray-400 truncate">{deal.title}</p>
        </div>
        <span
          className={`shrink-0 inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase border ${priorityStyle.badge}`}
        >
          {priorityStyle.label}
        </span>
      </div>
      <p className="text-base font-bold text-cyan-400 mb-2">
        {formatCurrency(deal.value)}
      </p>
      <div className="flex items-center justify-between text-[10px] text-gray-500">
        <span>{formatDate(deal.closeDate)}</span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border ${aiTier.badge}`}
        >
          {aiTier.label} · {deal.aiScore}
        </span>
      </div>
    </div>
  );
}
