"use client";

import { PremiumEmptyState } from "@/components/ui/PremiumEmptyState";
import type { Task } from "@/lib/tasks/types";
import { groupTasks } from "@/lib/tasks/utils";
import { TaskCard } from "./TaskCard";

type TasksListProps = {
  tasks: Task[];
  onToggleTask?: (id: string) => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
};

export function TasksList({
  tasks,
  onToggleTask,
  hasActiveFilters = false,
  onClearFilters,
}: TasksListProps) {
  const groups = groupTasks(tasks);

  if (tasks.length === 0) {
    if (hasActiveFilters && onClearFilters) {
      return (
        <PremiumEmptyState
          illustration="tasks"
          title="No tasks match your filters"
          description="Adjust your search, status, or priority filters to find the work you're looking for."
          cta={{ label: "Clear filters", onClick: onClearFilters }}
          className="border-dashed bg-[#111827]/50"
        />
      );
    }

    return (
      <PremiumEmptyState
        illustration="tasks"
        title="Stay on top of every deliverable"
        description="Tasks bring due dates, priorities, and assignees into one view — so nothing slips through while your AI agents handle the inbox."
        cta={{
          label: "Go to inbox",
          href: "/dashboard/inbox",
        }}
        className="border-dashed bg-[#111827]/50"
      />
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.id}>
          <div className="flex items-center gap-3 mb-3">
            <h2
              className={`text-xs font-semibold uppercase tracking-wider ${
                group.id === "overdue" ? "text-red-400" : "text-[#64748B]"
              }`}
            >
              {group.label}
            </h2>
            <div className="flex-1 h-px bg-[#1E293B]" />
            <span className="text-xs text-[#64748B] tabular-nums">
              {group.tasks.length}
            </span>
          </div>
          <div className="space-y-2">
            {group.tasks.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                index={i}
                onToggle={onToggleTask}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
