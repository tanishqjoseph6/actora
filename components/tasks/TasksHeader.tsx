"use client";

import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

type TasksHeaderProps = {
  onAddTask?: () => void;
};

export function TasksHeader({ onAddTask }: TasksHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-8">
      <div className="min-w-0">
        <p className={`mb-2 text-sm ${dashboard.subtle}`}>📝 Productivity</p>
        <h1 className={dashboard.pageTitle}>Tasks</h1>
        <p className={`${dashboard.muted} mt-2 max-w-xl text-sm sm:text-base`}>
          Stay on top of follow-ups, demos, and deliverables — prioritized and due-date driven.
        </p>
      </div>
      <button
        type="button"
        onClick={onAddTask}
        className={`${dashboard.btnPrimary} w-full min-h-[44px] shrink-0 px-4 py-2.5 text-sm sm:w-auto`}
      >
        + Add task
      </button>
    </div>
  );
}
