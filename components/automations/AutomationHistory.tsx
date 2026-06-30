"use client";

import { motion } from "framer-motion";
import type { AutomationRun } from "@/lib/automations/types";

const STATUS_STYLES = {
  success: "text-emerald-400 bg-emerald-500/15 border-emerald-400/25",
  failed: "text-rose-400 bg-rose-500/15 border-rose-400/25",
  skipped: "text-gray-400 bg-gray-500/15 border-gray-400/25",
};

type AutomationHistoryListProps = {
  runs: AutomationRun[];
};

export function AutomationHistoryList({ runs }: AutomationHistoryListProps) {
  return (
    <div className="rounded-[20px] bg-[#071426]/70 border border-[#00D4FF]/10 backdrop-blur-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#00D4FF]/10">
        <h2 className="text-lg font-semibold text-white">Run History</h2>
        <p className="text-sm text-gray-500">Recent workflow executions</p>
      </div>
      <ul className="divide-y divide-[#00D4FF]/5">
        {runs.map((run, i) => (
          <motion.li
            key={run.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-5 py-4 hover:bg-[#0B1730]/40 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{run.automationName}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {run.trigger} · {run.startedAt}
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
      className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-[20px] bg-[#071426]/70 border border-[#00D4FF]/10"
    >
      <div className="text-5xl mb-4">🛒</div>
      <h2 className="text-2xl font-bold text-white mb-2">Marketplace</h2>
      <p className="text-gray-500 max-w-md">
        Discover community-built automations from top operators. Coming soon.
      </p>
      <span className="mt-6 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#0B1730] border border-[#00D4FF]/20 text-[#00D4FF]">
        Coming Soon
      </span>
    </motion.div>
  );
}
