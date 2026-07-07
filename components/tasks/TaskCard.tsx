"use client";

import { motion } from "framer-motion";
import { getInitials } from "@/lib/avatar";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import type { Task } from "@/lib/tasks/types";
import {
  PRIORITY_STYLES,
  formatDueDate,
  getDueLabel,
  getDueTone,
} from "@/lib/tasks/utils";

const DUE_TONE_STYLES = {
  overdue: "text-red-400",
  today: "text-[#3B82F6]",
  upcoming: "text-[#64748B]",
  done: "text-[#475569]",
} as const;

type TaskCardProps = {
  task: Task;
  index?: number;
  onToggle?: (id: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
};

export function TaskCard({
  task,
  index = 0,
  onToggle,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const isDone = task.status === "done";
  const priority = PRIORITY_STYLES[task.priority];
  const dueTone = getDueTone(task);
  const inProgress = task.status === "in_progress";

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileTap={{ scale: 0.995 }}
      className={`
        group flex items-start gap-3 sm:gap-4 p-4
        ${dashboard.cardInteractive}
        ${isDone ? "opacity-60" : ""}
        ${dueTone === "overdue" && !isDone ? "border-red-500/25" : ""}
      `}
    >
      <button
        type="button"
        onClick={() => onToggle?.(task.id)}
        aria-label={isDone ? `Mark "${task.title}" incomplete` : `Mark "${task.title}" complete`}
        className={`
          mt-0.5 w-5 h-5 rounded-md border shrink-0 flex items-center justify-center transition-colors
          ${
            isDone
              ? "bg-[#2563EB] border-[#2563EB] text-white"
              : "border-[#334155] hover:border-[#2563EB]/60 bg-[#0B1220]"
          }
        `}
      >
        {isDone && (
          <CheckIcon className="w-3 h-3" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3
            className={`text-sm font-semibold text-white transition-colors ${
              isDone ? "line-through text-[#64748B]" : "group-hover:text-[#93C5FD]"
            }`}
          >
            {task.title}
          </h3>
          {inProgress && !isDone && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide border border-[#2563EB]/30 text-[#3B82F6] bg-[#2563EB]/10">
              In progress
            </span>
          )}
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${priority.badge}`}
          >
            {priority.label}
          </span>
        </div>

        <p className={`text-xs ${dashboard.muted} line-clamp-2 mb-2.5`}>
          {task.description}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${DUE_TONE_STYLES[dueTone]}`}
          >
            <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
            {getDueLabel(task)}
            <span className="text-[#475569] font-normal hidden sm:inline">
              · {formatDueDate(task.dueDate)}
            </span>
          </span>

          {task.companyName && (
            <span className="text-xs text-[#3B82F6]">{task.companyName}</span>
          )}

          <span className="inline-flex items-center gap-1.5 text-xs text-[#64748B]">
            <span className="w-5 h-5 rounded-md bg-[#2563EB] flex items-center justify-center text-[8px] font-bold text-white">
              {getInitials(task.assignee)}
            </span>
            {task.assignee}
          </span>
        </div>

        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded-md text-[9px] border border-[#1E293B] bg-[#0B1220] text-[#64748B]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {(onEdit || onDelete) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#1E293B]">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="px-2 py-1 rounded-md text-xs bg-[#1E293B] text-[#BFDBFE] hover:bg-[#2563EB]/20"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(task)}
                className="px-2 py-1 rounded-md text-xs bg-[#1E293B] text-[#FCA5A5] hover:bg-[#7F1D1D]/30"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
