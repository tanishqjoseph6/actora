"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { formatCurrency } from "@/lib/crm/mock-data";
import type { DealStage } from "@/lib/crm/types";
import { PIPELINE_STAGES, type PipelineDeal } from "@/lib/crm/pipeline";
import { PipelineDealCard } from "./PipelineDealCard";
import { PipelineColumnEmpty } from "./PipelineEmptyState";

type PipelineColumnProps = {
  stageId: DealStage;
  deals: PipelineDeal[];
};

export function PipelineColumn({ stageId, deals }: PipelineColumnProps) {
  const stage = PIPELINE_STAGES.find((s) => s.id === stageId)!;
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

  const { setNodeRef, isOver } = useDroppable({
    id: stageId,
    data: { type: "column", stageId },
  });

  return (
    <motion.div
      layout
      className="flex flex-col w-[280px] sm:w-[300px] shrink-0"
    >
      <div
        className={`mb-3 px-3 py-2.5 rounded-xl bg-gradient-to-r ${stage.accent} border border-cyan-400/15 backdrop-blur-sm`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${stage.dot}`} />
            <h3 className="text-sm font-semibold text-white truncate">
              {stage.label}
            </h3>
            <span className="text-xs text-gray-400 tabular-nums shrink-0">
              {deals.length}
            </span>
          </div>
          <span className="text-xs font-medium text-cyan-400/80 tabular-nums shrink-0">
            {formatCurrency(totalValue)}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`
          flex-1 min-h-[200px] rounded-2xl p-2 space-y-2.5 transition-all duration-200
          bg-[#081226]/40 border border-cyan-400/10 backdrop-blur-sm
          ${isOver ? "border-cyan-400/40 bg-cyan-500/5 ring-1 ring-cyan-400/20" : ""}
        `}
      >
        <SortableContext
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          <AnimatePresence mode="popLayout">
            {deals.length === 0 ? (
              <PipelineColumnEmpty stageLabel={stage.label} isOver={isOver} />
            ) : (
              deals.map((deal) => (
                <PipelineDealCard key={deal.id} deal={deal} />
              ))
            )}
          </AnimatePresence>
        </SortableContext>
      </div>
    </motion.div>
  );
}
