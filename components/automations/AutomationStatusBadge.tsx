"use client";

import type { WorkflowStatus } from "@/lib/automations/types";

const STATUS_CONFIG: Record<
  WorkflowStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-gray-500/15 text-gray-300 border-gray-400/30",
  },
  active: {
    label: "Active",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-400/30 ",
  },
  paused: {
    label: "Paused",
    className: "bg-amber-500/15 text-amber-400 border-amber-400/30",
  },
};

type AutomationStatusBadgeProps = {
  status: WorkflowStatus;
  size?: "sm" | "md";
};

export function AutomationStatusBadge({ status, size = "sm" }: AutomationStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wide rounded-full border ${
        size === "md" ? "text-xs px-3 py-1" : "text-[10px] px-2 py-0.5"
      } ${config.className}`}
    >
      {status === "active" && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      )}
      {config.label}
    </span>
  );
}
