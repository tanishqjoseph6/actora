"use client";

import { motion } from "framer-motion";
import type { Automation } from "@/lib/automations/types";
import { AutomationStatusBadge } from "./AutomationStatusBadge";

type AutomationCardProps = {
  automation: Automation;
  onClick?: () => void;
  selected?: boolean;
};

export function AutomationCard({ automation, onClick, selected }: AutomationCardProps) {
  const triggerNode = automation.nodes.find((n) => n.category === "trigger");

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      onClick={onClick}
      className={`
        group relative rounded-[20px] bg-[#071426]/70 border backdrop-blur-xl p-5 cursor-pointer transition-shadow duration-300 overflow-hidden
        ${selected
          ? "border-[#00D4FF]/40 shadow-[0_0_28px_rgba(0,212,255,0.12)]"
          : "border-[#00D4FF]/10 hover:border-[#00D4FF]/25 hover:shadow-[0_0_24px_rgba(0,212,255,0.08)]"
        }
      `}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#4F8CFF]/5 blur-3xl rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          {triggerNode && (
            <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-[#4F8CFF]/20 to-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center text-xl shrink-0">
              {triggerNode.icon}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-white truncate group-hover:text-[#00D4FF] transition-colors">
              {automation.name}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{automation.description || "No description"}</p>
            <p className="text-[10px] text-[#4F8CFF]/80 mt-1 uppercase tracking-wider">
              Trigger · {automation.triggerLabel}
            </p>
          </div>
        </div>
        <AutomationStatusBadge status={automation.status} />
      </div>

      <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#00D4FF]/10">
        <Metric label="Last Execution" value={automation.lastRun} highlight />
        <Metric label="Total Runs" value={String(automation.totalExecutions)} />
        <Metric label="Success Rate" value={`${automation.successRate}%`} accent={automation.successRate >= 90} />
        <Metric label="Runs Today" value={String(automation.runsToday)} />
      </div>

      <div className="relative flex items-center gap-4 mt-3 pt-3 border-t border-[#00D4FF]/5 text-[10px] text-gray-600">
        <span>{automation.nodes.length} steps</span>
        <span>v{automation.version}</span>
        <span>{automation.createdBy}</span>
        {automation.executionTimeMs > 0 && (
          <span className="ml-auto tabular-nums">{automation.executionTimeMs}ms avg</span>
        )}
      </div>
    </motion.article>
  );
}

function Metric({
  label,
  value,
  highlight,
  accent,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] text-gray-600 uppercase tracking-wider">{label}</p>
      <p
        className={`text-sm font-semibold tabular-nums truncate ${
          highlight ? "text-white" : accent ? "text-emerald-400" : "text-gray-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
