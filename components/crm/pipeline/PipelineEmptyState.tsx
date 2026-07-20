"use client";

import { motion } from "framer-motion";

type PipelineColumnEmptyProps = {
  stageLabel: string;
  isOver?: boolean;
};

export function PipelineColumnEmpty({
  stageLabel,
  isOver,
}: PipelineColumnEmptyProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`
        flex flex-col items-center justify-center py-10 px-4 text-center rounded-xl
        border border-dashed transition-colors duration-200
        ${isOver ? "border-[#3B82F6]/50 bg-[#3B82F6]/5" : "border-white/[0.06] bg-transparent"}
      `}
    >
      <div className="w-10 h-10 rounded-xl bg-[#111111] border border-white/[0.06] flex items-center justify-center mb-3">
        <DropIcon className={`w-5 h-5 ${isOver ? "text-[#3B82F6]" : "text-[#71717A]"}`} />
      </div>
      <p className="text-xs text-[#71717A]">
        {isOver ? "Drop deal here" : `No deals in ${stageLabel}`}
      </p>
    </motion.div>
  );
}

export function PipelineBoardEmpty() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-xl border border-white/[0.06] bg-[#111111]"
    >
      <div className="w-16 h-16 rounded-xl bg-[#0A0A0A] border border-white/[0.06] flex items-center justify-center mb-5">
        <FilterIcon className="w-8 h-8 text-[#71717A]" />
      </div>
      <p className="text-white font-medium mb-1">No deals match your filters</p>
      <p className="text-sm text-[#71717A] max-w-sm">
        Try adjusting your search, owner, priority, or stage filters to see deals
        in the pipeline.
      </p>
    </motion.div>
  );
}

function DropIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
    </svg>
  );
}
