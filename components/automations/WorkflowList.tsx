"use client";

import { motion } from "framer-motion";
import type { Automation } from "@/lib/automations/types";
import { AutomationCard } from "./AutomationCard";

type WorkflowListProps = {
  title: string;
  workflows: Automation[];
  selectedId: string | null;
  onSelect: (workflow: Automation) => void;
  emptyMessage?: string;
};

export function WorkflowList({
  title,
  workflows,
  selectedId,
  onSelect,
  emptyMessage,
}: WorkflowListProps) {
  if (workflows.length === 0 && emptyMessage) {
    return (
      <div className="rounded-[20px] border border-dashed border-[#1E293B] p-8 text-center">
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <span className="text-xs text-gray-500 tabular-nums">{workflows.length} workflows</span>
      </div>
      <div className="grid gap-4">
        {workflows.map((automation, i) => (
          <motion.div
            key={automation.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <AutomationCard
              automation={automation}
              selected={selectedId === automation.id}
              onClick={() => onSelect(automation)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
