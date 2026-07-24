"use client";

import { motion } from "framer-motion";
import { History } from "lucide-react";
import { CompactEmptyState } from "@/components/ui/CompactEmptyState";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import type { AutomationRun } from "@/lib/automations/types";

const STATUS_STYLES = {
  success: "text-emerald-400 bg-emerald-500/15 border-emerald-400/25",
  failed: "text-rose-400 bg-rose-500/15 border-rose-400/25",
  skipped: "text-gray-400 bg-gray-500/15 border-gray-400/25",
  running: "text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/30",
};

type AutomationHistoryListProps = {
  runs: AutomationRun[];
  onSelectRun?: (run: AutomationRun) => void;
  selectedRunId?: string | null;
};

export function AutomationHistoryList({ runs, onSelectRun, selectedRunId }: AutomationHistoryListProps) {
  if (runs.length === 0) {
    return (
      <CompactEmptyState
        icon={History}
        title="No executions yet"
        description="Run a test from the workflow editor or publish an automation to see history here."
        className={`${dashboard.cardLg} border-0 py-12`}
      />
    );
  }

  return (
    <div className={`${dashboard.cardLg} overflow-hidden`}>
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h2 className="text-lg font-semibold text-white">Execution History</h2>
        <p className={`text-sm ${dashboard.muted}`}>
          {runs.length} total execution{runs.length === 1 ? "" : "s"} · Click a run for step logs
        </p>
      </div>
      <ul className="divide-y divide-white/[0.06]">
        {runs.map((run, i) => (
          <motion.li
            key={run.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => onSelectRun?.(run)}
            className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-5 py-4 transition-colors ${
              onSelectRun ? "cursor-pointer hover:bg-[#3B82F6]/5" : ""
            } ${selectedRunId === run.id ? "bg-[#3B82F6]/8 border-l-2 border-l-[#3B82F6]" : ""}`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate flex items-center gap-2">
                {run.automationName}
                {run.isTest && (
                  <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#3B82F6]/10 text-[#93C5FD] border border-[#3B82F6]/30">
                    Test
                  </span>
                )}
              </p>
              <p className={`text-xs ${dashboard.subtle} mt-0.5`}>
                {run.trigger} · {run.startedAtDisplay ?? run.startedAt}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-xs ${dashboard.subtle} tabular-nums`}>
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
      className={`flex flex-col items-center justify-center py-20 px-6 text-center ${dashboard.cardLg}`}
    >
      <div className="text-5xl mb-4">🛒</div>
      <h2 className="text-2xl font-bold text-white mb-2">Marketplace</h2>
      <p className={`${dashboard.muted} max-w-md`}>
        Discover community-built automations from top operators. Coming soon.
      </p>
      <span className="mt-6 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#0A0A0A] border border-white/[0.06] text-[#3B82F6]">
        Coming Soon
      </span>
    </motion.div>
  );
}
