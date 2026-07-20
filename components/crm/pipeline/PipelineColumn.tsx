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
      <div className={`mb-3 px-3 py-2.5 rounded-[18px] border border-white/[0.06] bg-[#111111]`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${stage.dot}`} />
            <h3 className="text-sm font-semibold text-white truncate">
              {stage.label}
            </h3>
            <span className="text-xs text-[#71717A] tabular-nums shrink-0 px-1.5 py-0.5 rounded-md bg-[#0A0A0A] border border-white/[0.06]">
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
          flex-1 min-h-[240px] rounded-[18px] p-2 space-y-2 transition-all duration-200
          bg-[#0A0A0A]/50 border border-white/[0.06]
          ${isOver ? "border-[#3B82F6]/50 bg-[#3B82F6]/5 ring-1 ring-[#2563EB]/20" : ""}
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
