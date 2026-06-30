"use client";

import { motion } from "framer-motion";
import type { Automation } from "@/lib/automations/types";

const STATUS_STYLES: Record<Automation["status"], string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-400/30",
  paused: "bg-amber-500/15 text-amber-400 border-amber-400/30",
  draft: "bg-gray-500/15 text-gray-400 border-gray-400/30",
  error: "bg-rose-500/15 text-rose-400 border-rose-400/30",
};

type AutomationCardProps = {
  automation: Automation;
  onClick?: () => void;
  selected?: boolean;
};

export function AutomationCard({ automation, onClick, selected }: AutomationCardProps) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      onClick={onClick}
      className={`
        group rounded-[20px] bg-[#071426]/70 border backdrop-blur-xl p-5 cursor-pointer transition-shadow duration-300
        ${selected
          ? "border-[#00D4FF]/40 shadow-[0_0_28px_rgba(0,212,255,0.12)]"
          : "border-[#00D4FF]/10 hover:border-[#00D4FF]/25 hover:shadow-[0_0_24px_rgba(0,212,255,0.08)]"
        }
      `}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-white truncate group-hover:text-[#00D4FF] transition-colors">
            {automation.name}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{automation.description}</p>
        </div>
        <span
          className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${STATUS_STYLES[automation.status]}`}
        >
          {automation.status}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-[#00D4FF]/10">
        <Metric label="Last Run" value={automation.lastRun} />
        <Metric label="Runs Today" value={String(automation.runsToday)} />
        <Metric label="Success Rate" value={`${automation.successRate}%`} />
        <Metric label="Created By" value={automation.createdBy} />
        <Metric
          label="Execution Time"
          value={automation.executionTimeMs ? `${automation.executionTimeMs}ms` : "—"}
        />
        <Metric label="Steps" value={String(automation.nodes.length)} />
      </div>
    </motion.article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-gray-600 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-gray-300 font-medium tabular-nums truncate">{value}</p>
    </div>
  );
}
