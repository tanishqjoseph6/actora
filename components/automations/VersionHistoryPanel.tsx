"use client";

import { motion } from "framer-motion";
import type { WorkflowVersion } from "@/lib/automations/types";

type VersionHistoryPanelProps = {
  versions: WorkflowVersion[];
  loading?: boolean;
};

export function VersionHistoryPanel({ versions, loading }: VersionHistoryPanelProps) {
  if (loading) {
    return (
      <div className="rounded-[20px] bg-[#071426]/70 border border-[#00D4FF]/10 p-5 animate-pulse">
        <div className="h-4 w-32 bg-[#00D4FF]/10 rounded mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-[#00D4FF]/5 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (versions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[20px] bg-[#071426]/70 border border-[#00D4FF]/10 backdrop-blur-xl overflow-hidden mt-4"
    >
      <div className="px-5 py-4 border-b border-[#00D4FF]/10">
        <h3 className="text-base font-semibold text-white">Version History</h3>
        <p className="text-xs text-gray-500">{versions.length} saved versions</p>
      </div>
      <ul className="divide-y divide-[#00D4FF]/5 max-h-64 overflow-y-auto premium-scrollbar">
        {versions.map((v) => (
          <li key={v.id} className="px-5 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-white">
                v{v.version} · {v.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {v.changeNote ?? "Updated"} · {v.nodes.length} steps · {v.status}
              </p>
            </div>
            <time className="text-[10px] text-gray-600 shrink-0">
              {new Date(v.createdAt).toLocaleDateString()}
            </time>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
