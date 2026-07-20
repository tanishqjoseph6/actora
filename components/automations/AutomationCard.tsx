"use client";

import { motion } from "framer-motion";
import { Copy, Pause, Play, Trash2 } from "lucide-react";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import type { Automation } from "@/lib/automations/types";
import { AutomationStatusBadge } from "./AutomationStatusBadge";

type AutomationCardProps = {
  automation: Automation;
  onClick?: () => void;
  selected?: boolean;
  onToggle?: (automation: Automation) => void;
  onDuplicate?: (automation: Automation) => void;
  onDelete?: (automation: Automation) => void;
  busy?: boolean;
};

export function AutomationCard({
  automation,
  onClick,
  selected,
  onToggle,
  onDuplicate,
  onDelete,
  busy,
}: AutomationCardProps) {
  const triggerNode = automation.nodes.find((n) => n.category === "trigger");
  const isActive = automation.status === "active";
  const canToggle =
    automation.status === "active" ||
    automation.status === "paused" ||
    automation.status === "draft";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={`
        group relative overflow-hidden p-5
        ${dashboard.cardInteractive}
        ${selected ? "border-[#2563EB]/50 ring-1 ring-[#2563EB]/20" : ""}
      `}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#3B82F6]/5 blur-3xl rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative flex items-start justify-between gap-3 mb-4">
        <button
          type="button"
          onClick={onClick}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          {triggerNode && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/[0.06] bg-[#0A0A0A] text-xl">
              {triggerNode.icon}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-white transition-colors group-hover:text-[#93C5FD]">
              {automation.name}
            </h3>
            <p className={`mt-0.5 line-clamp-1 text-sm ${dashboard.muted}`}>
              {automation.description || "No description"}
            </p>
            <p
              className={`mt-1 text-[10px] uppercase tracking-wider ${dashboard.subtle}`}
            >
              Trigger · {automation.triggerLabel}
            </p>
          </div>
        </button>
        <AutomationStatusBadge status={automation.status} />
      </div>

      <button type="button" onClick={onClick} className="w-full text-left">
        <div className="relative grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3 sm:grid-cols-4">
          <Metric label="Last Execution" value={automation.lastRun} highlight />
          <Metric label="Total Runs" value={String(automation.totalExecutions)} />
          <Metric
            label="Success Rate"
            value={`${automation.successRate}%`}
            accent={automation.successRate >= 90}
          />
          <Metric label="Runs Today" value={String(automation.runsToday)} />
        </div>
      </button>

      <div
        className={`relative mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3 text-[10px] ${dashboard.subtle}`}
      >
        <span>{automation.nodes.length} steps</span>
        <span>v{automation.version}</span>
        {automation.executionTimeMs > 0 && (
          <span className="tabular-nums">{automation.executionTimeMs}ms avg</span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          {canToggle && onToggle && (
            <ActionBtn
              disabled={busy}
              onClick={() => onToggle(automation)}
              title={isActive ? "Disable" : "Enable"}
            >
              {isActive ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {isActive ? "Disable" : "Enable"}
            </ActionBtn>
          )}
          {onDuplicate && (
            <ActionBtn
              disabled={busy}
              onClick={() => onDuplicate(automation)}
              title="Duplicate"
            >
              <Copy className="h-3.5 w-3.5" />
              Duplicate
            </ActionBtn>
          )}
          {onDelete && (
            <ActionBtn
              disabled={busy}
              onClick={() => onDelete(automation)}
              title="Delete"
              danger
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </ActionBtn>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function ActionBtn({
  children,
  onClick,
  disabled,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-medium transition disabled:opacity-50 ${
        danger
          ? "border-red-500/25 text-red-300 hover:bg-red-500/10"
          : "border-white/[0.08] text-[#A1A1AA] hover:border-[#3B82F6]/40 hover:text-white"
      }`}
    >
      {children}
    </button>
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
      <p className={`text-[10px] uppercase tracking-wider ${dashboard.subtle}`}>
        {label}
      </p>
      <p
        className={`truncate text-sm font-semibold tabular-nums ${
          highlight ? "text-white" : accent ? "text-emerald-400" : dashboard.muted
        }`}
      >
        {value}
      </p>
    </div>
  );
}
