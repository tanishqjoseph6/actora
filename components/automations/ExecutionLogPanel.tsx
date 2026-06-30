"use client";

import { motion } from "framer-motion";
import type { AutomationRun, ExecutionLog } from "@/lib/automations/types";

const LOG_STATUS_STYLES = {
  success: "text-emerald-400 border-emerald-400/25 bg-emerald-500/10",
  failed: "text-rose-400 border-rose-400/25 bg-rose-500/10",
  skipped: "text-gray-400 border-gray-400/25 bg-gray-500/10",
};

type ExecutionLogPanelProps = {
  run: AutomationRun | null;
  logs: ExecutionLog[];
  onClose?: () => void;
};

export function ExecutionLogPanel({ run, logs, onClose }: ExecutionLogPanelProps) {
  if (!run) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[20px] bg-[#071426]/70 border border-[#00D4FF]/10 backdrop-blur-xl overflow-hidden mt-4"
    >
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#00D4FF]/10">
        <div>
          <h3 className="text-base font-semibold text-white">
            {run.isTest ? "Test Run" : "Execution"} · {run.automationName}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {run.trigger} · {run.durationMs}ms ·{" "}
            <span
              className={
                run.status === "success"
                  ? "text-emerald-400"
                  : run.status === "failed"
                    ? "text-rose-400"
                    : "text-gray-400"
              }
            >
              {run.status}
            </span>
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-white px-2 py-1"
          >
            Close
          </button>
        )}
      </div>

      <ul className="divide-y divide-[#00D4FF]/5 max-h-80 overflow-y-auto premium-scrollbar">
        {logs.map((log, i) => (
          <motion.li
            key={log.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="px-5 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-white">
                  <span className="text-gray-500 mr-2">Step {log.stepIndex + 1}</span>
                  {log.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{log.message}</p>
                {Object.keys(log.output).length > 0 && (
                  <pre className="mt-2 text-[10px] text-[#4F8CFF]/80 bg-[#0B1730]/60 rounded-lg p-2 overflow-x-auto">
                    {JSON.stringify(log.output, null, 2)}
                  </pre>
                )}
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${LOG_STATUS_STYLES[log.status]}`}
                >
                  {log.status}
                </span>
                <p className="text-[10px] text-gray-600 mt-1 tabular-nums">{log.durationMs}ms</p>
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
