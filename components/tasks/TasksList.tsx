"use client";

import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import type { Task } from "@/lib/tasks/types";
import { groupTasks } from "@/lib/tasks/utils";
import { TaskCard } from "./TaskCard";

type TasksListProps = {
  tasks: Task[];
  onToggleTask?: (id: string) => void;
};

export function TasksList({ tasks, onToggleTask }: TasksListProps) {
  const groups = groupTasks(tasks);

  if (tasks.length === 0) {
    return (
      <div className={`${dashboard.cardLg} p-10 text-center`}>
        <div className="w-14 h-14 rounded-xl bg-[#0B1220] border border-[#1E293B] flex items-center justify-center mx-auto mb-4 text-2xl">
          ✓
        </div>
        <p className="text-white font-medium mb-1">No tasks found</p>
        <p className={`text-sm ${dashboard.subtle}`}>
          Try adjusting your search or filters.
        </p>
      </div>
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
