"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

type DemoTooltipProps = {
  text: string;
  stepIndex: number;
};

export function DemoTooltip({ text, stepIndex }: DemoTooltipProps) {
  return (
    <motion.div
      key={stepIndex}
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none absolute bottom-24 left-1/2 z-20 max-w-md -translate-x-1/2 px-4 sm:bottom-28"
    >
      <div className="flex items-start gap-3 rounded-2xl border border-[#2563EB]/30 bg-[#111111]/90 px-4 py-3.5 shadow-[0_8px_40px_rgba(37,99,235,0.2)] backdrop-blur-xl">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#2563EB]/20 text-[#93C5FD]">
          <Sparkles className="h-4 w-4" />
        </div>
        <p className="text-sm font-medium leading-snug text-white">{text}</p>
      </div>
    </motion.div>
  );
}
