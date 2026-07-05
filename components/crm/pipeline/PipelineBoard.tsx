"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  defaultDropAnimationSideEffects,
  type DragEndEvent,
  type DragStartEvent,
  type DropAnimation,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import {
  MOCK_PIPELINE_DEALS,
  PIPELINE_STAGES,
  filterPipelineDeals,
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
import {
  PipelineDealCardOverlay,
} from "./PipelineDealCard";
import { PipelineDealDetailPanel } from "./PipelineDealDetailPanel";

const DEFAULT_FILTERS: PipelineFilters = {
  search: "",
  owner: "all",
  companyId: "all",
  priority: "all",
  stage: "all",
  aiScoreTier: "all",
  sort: "value-desc",
};

const dropAnimation: DropAnimation = {
  duration: 280,
  easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.35" } },
  }),
};

export function PipelineBoard() {
  const [deals, setDeals] = useState<PipelineDeal[]>(MOCK_PIPELINE_DEALS);
  const [filters, setFilters] = useState<PipelineFilters>(DEFAULT_FILTERS);
  const [activeDeal, setActiveDeal] = useState<PipelineDeal | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<PipelineDeal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 6 },
    }),
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

  const selectedDealLive = useMemo(() => {
    if (!selectedDeal) return null;
    return deals.find((d) => d.id === selectedDeal.id) ?? selectedDeal;
  }, [deals, selectedDeal]);

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

    if (selectedDeal?.id === dealId) {
      setSelectedDeal((prev) =>
        prev ? { ...prev, stage: targetStage! } : null
      );
    }
  }

  function handleDragCancel() {
    setActiveDeal(null);
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
          onDragCancel={handleDragCancel}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="overflow-x-auto pb-2 premium-scrollbar snap-x snap-mandatory"
          >
            <div className="flex gap-3 min-w-max px-0.5">
              {visibleStages.map((stageId) => (
                <PipelineColumn
                  key={stageId}
                  stageId={stageId}
                  deals={dealsByStage[stageId]}
                  selectedDealId={selectedDeal?.id}
                  onSelectDeal={setSelectedDeal}
                />
              ))}
            </div>
          </motion.div>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeDeal ? <PipelineDealCardOverlay deal={activeDeal} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <PipelineDealDetailPanel
        deal={selectedDealLive}
        onClose={() => setSelectedDeal(null)}
      />
    </>
  );
}
