"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { formatCurrency } from "@/lib/crm/mock-data";
import type { DealStage } from "@/lib/crm/types";
import { PIPELINE_STAGES, type PipelineDeal } from "@/lib/crm/pipeline";
import { PipelineDealCard } from "./PipelineDealCard";
import { PipelineColumnEmpty } from "./PipelineEmptyState";

type PipelineColumnProps = {
  stageId: DealStage;
  deals: PipelineDeal[];
  selectedDealId?: string | null;
  onSelectDeal?: (deal: PipelineDeal) => void;
};

export function PipelineColumn({
  stageId,
  deals,
  selectedDealId,
  onSelectDeal,
}: PipelineColumnProps) {
  const stage = PIPELINE_STAGES.find((s) => s.id === stageId)!;
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

  const { setNodeRef, isOver } = useDroppable({
    id: stageId,
    data: { type: "column", stageId },
  });

  return (
    <div className="flex flex-col w-[min(72vw,260px)] sm:w-[280px] md:w-[308px] shrink-0 snap-start">
      <div className="mb-3 px-3 py-2.5 rounded-xl border border-[#1E293B] bg-[#111827]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${stage.dot}`} />
            <h3 className="text-sm font-semibold text-white truncate">
              {stage.label}
            </h3>
            <span className="text-xs text-[#64748B] tabular-nums shrink-0 px-1.5 py-0.5 rounded-md bg-[#0B1220] border border-[#1E293B]">
              {deals.length}
            </span>
          </div>
          <span className="text-xs font-medium text-[#3B82F6] tabular-nums shrink-0">
            {formatCurrency(totalValue)}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`
          flex-1 min-h-[240px] rounded-xl p-2 space-y-2 transition-all duration-200
          bg-[#0B1220]/50 border border-[#1E293B]
          ${isOver ? "border-[#2563EB]/50 bg-[#2563EB]/5 ring-1 ring-[#2563EB]/20" : ""}
        `}
      >
        <SortableContext
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.length === 0 ? (
            <PipelineColumnEmpty stageLabel={stage.label} isOver={isOver} />
          ) : (
            deals.map((deal) => (
              <PipelineDealCard
                key={deal.id}
                deal={deal}
                isSelected={selectedDealId === deal.id}
                onSelect={onSelectDeal}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
