"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import type { Automation } from "@/lib/automations/types";
import { AutomationCard } from "./AutomationCard";

type WorkflowListProps = {
  title: string;
  workflows: Automation[];
  selectedId: string | null;
  onSelect: (workflow: Automation) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggle?: (automation: Automation) => void;
  onDuplicate?: (automation: Automation) => void;
  onDelete?: (automation: Automation) => void;
  busy?: boolean;
  emptyMessage?: string;
};

export function WorkflowList({
  title,
  workflows,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  onToggle,
  onDuplicate,
  onDelete,
  busy,
  emptyMessage,
}: WorkflowListProps) {
  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? workflows.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q) ||
          w.triggerLabel.toLowerCase().includes(q) ||
          w.nodes.some((n) => n.label.toLowerCase().includes(q))
      )
    : workflows;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <span className="text-xs tabular-nums text-[#71717A]">
            {filtered.length}
            {q ? ` of ${workflows.length}` : ""} workflows
          </span>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#71717A]" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search automations…"
            className={`${dashboard.input} w-full py-2 pl-9 pr-3 text-sm`}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-white/[0.08] p-8 text-center">
          <p className={`text-sm ${dashboard.subtle}`}>
            {emptyMessage ||
              (q
                ? "No automations match your search."
                : "No workflows yet.")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((automation, i) => (
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
                onToggle={onToggle}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                busy={busy}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
