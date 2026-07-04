"use client";

import { motion } from "framer-motion";
import type { AutomationRun } from "@/lib/automations/types";

const STATUS_STYLES = {
  success: "text-emerald-400 bg-emerald-500/15 border-emerald-400/25",
  failed: "text-rose-400 bg-rose-500/15 border-rose-400/25",
  skipped: "text-gray-400 bg-gray-500/15 border-gray-400/25",
  running: "text-[#2563EB] bg-[#2563EB]/10 border-[#1E293B]",
};

type AutomationHistoryListProps = {
  runs: AutomationRun[];
  onSelectRun?: (run: AutomationRun) => void;
  selectedRunId?: string | null;
};

export function AutomationHistoryList({ runs, onSelectRun, selectedRunId }: AutomationHistoryListProps) {
  if (runs.length === 0) {
    return (
      <div className="rounded-[20px] bg-[#111827]/70 border border-[#1E293B] backdrop-blur-xl px-5 py-12 text-center">
        <p className="text-lg font-semibold text-white mb-2">No executions yet</p>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Run a test from the workflow editor or publish an automation to see execution history here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] bg-[#111827]/70 border border-[#1E293B] backdrop-blur-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1E293B]">
        <h2 className="text-lg font-semibold text-white">Execution History</h2>
        <p className="text-sm text-gray-500">
          {runs.length} total execution{runs.length === 1 ? "" : "s"} · Click a run for step logs
        </p>
      </div>
      <ul className="divide-y divide-[#2563EB]/5">
        {runs.map((run, i) => (
          <motion.li
            key={run.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => onSelectRun?.(run)}
            className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-5 py-4 transition-colors ${
              onSelectRun ? "cursor-pointer hover:bg-[#111827]/40" : ""
            } ${selectedRunId === run.id ? "bg-[#111827]/50" : ""}`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate flex items-center gap-2">
                {run.automationName}
                {run.isTest && (
                  <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#2563EB]/10 text-[#2563EB] border border-[#1E293B]">
                    Test
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {run.trigger} · {run.startedAtDisplay ?? run.startedAt}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-gray-500 tabular-nums">
                {run.durationMs ? `${run.durationMs}ms` : "—"}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${STATUS_STYLES[run.status]}`}
              >
                {run.status}
              </span>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

export function MarketplaceComingSoon() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-[20px] bg-[#111827]/70 border border-[#1E293B]"
    >
      <div className="text-5xl mb-4">🛒</div>
      <h2 className="text-2xl font-bold text-white mb-2">Marketplace</h2>
      <p className="text-gray-500 max-w-md">
        Discover community-built automations from top operators. Coming soon.
      </p>
      <span className="mt-6 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#111827] border border-[#1E293B] text-[#2563EB]">
        Coming Soon
      </span>
    </motion.div>
  );
}
