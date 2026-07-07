"use client";

import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

type TasksHeaderProps = {
  onAddTask?: () => void;
};

export function TasksHeader({ onAddTask }: TasksHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 lg:mb-8">
      <div>
        <p className={`text-sm ${dashboard.subtle} mb-2`}>📝 Productivity</p>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
          Tasks
        </h1>
        <p className={`${dashboard.muted} mt-2 text-sm sm:text-base max-w-xl`}>
          Stay on top of follow-ups, demos, and deliverables — prioritized and due-date driven.
        </p>
      </div>
      <button
        type="button"
        onClick={onAddTask}
        className={`${dashboard.btnPrimary} px-4 py-2.5 text-sm shrink-0`}
      >
        + Add task
      </button>
    </div>
  );
}
