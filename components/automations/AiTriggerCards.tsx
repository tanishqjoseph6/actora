"use client";

import { motion } from "framer-motion";
import { TRIGGER_BLOCKS } from "@/lib/automations/constants";
import type { BlockDefinition } from "@/lib/automations/types";

type AiTriggerCardsProps = {
  onSelectTrigger: (trigger: BlockDefinition) => void;
  disabled?: boolean;
};

export function AiTriggerCards({ onSelectTrigger, disabled }: AiTriggerCardsProps) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">AI Triggers</h2>
          <p className="text-sm text-gray-500">Start a workflow from a smart trigger</p>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-[#2563EB]/70 px-2 py-1 rounded-full border border-[#1E293B]">
          Powered by AI
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {TRIGGER_BLOCKS.map((trigger, i) => (
          <motion.button
            key={trigger.id}
            type="button"
            disabled={disabled}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={disabled ? undefined : { y: -4, scale: 1.02 }}
            onClick={() => onSelectTrigger(trigger)}
            className="group relative text-left rounded-[16px] bg-[#111827]/70 border border-[#1E293B] backdrop-blur-xl p-4 hover:border-[#1E293B] hover: transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            <div className="absolute inset-0 bg-[#2563EB]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="relative">
              <span className="text-2xl mb-2 block" aria-hidden>
                {trigger.icon}
              </span>
              <p className="text-sm font-semibold text-white group-hover:text-[#2563EB] transition-colors">
                {trigger.label}
              </p>
              <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                {trigger.description}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
