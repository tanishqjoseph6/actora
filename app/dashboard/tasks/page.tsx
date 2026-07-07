"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CrmFilterChips } from "@/components/crm/CrmFilterChips";
import { CrmSearchInput } from "@/components/crm/CrmSearchInput";
import { CrmSelectFilter } from "@/components/crm/CrmSelectFilter";
import { PremiumMetricCard } from "@/components/dashboard/premium/PremiumMetricCard";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { TasksHeader } from "@/components/tasks/TasksHeader";
import { TasksContentSkeleton } from "@/components/tasks/TasksContentSkeleton";
import { TasksList } from "@/components/tasks/TasksList";
import { MOCK_TASKS } from "@/lib/tasks/mock-data";
import type { Task, TaskFilter, TaskSort } from "@/lib/tasks/types";
import {
  computeTaskMetrics,
  filterTasks,
  isTaskOverdue,
  sortTasks,
} from "@/lib/tasks/utils";

export default function TasksPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sort, setSort] = useState<TaskSort>("due-date");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 280);
    return () => clearTimeout(timer);
  }, []);

  const filterCounts = useMemo(() => {
    const today = new Date();
    const open = tasks.filter((t) => t.status !== "done");
    return {
      all: tasks.length,
      open: open.length,
      overdue: open.filter((t) => isTaskOverdue(t, today)).length,
      done: tasks.filter((t) => t.status === "done").length,
    };
  }, [tasks]);

  const metrics = useMemo(() => computeTaskMetrics(tasks), [tasks]);

  const filteredTasks = useMemo(() => {
    const filtered = filterTasks(tasks, {
      search,
      statusFilter,
      priority: priorityFilter,
    });
    return sortTasks(filtered, sort);
  }, [tasks, search, statusFilter, priorityFilter, sort]);

  const handleToggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === "done" ? "todo" : "done",
            }
          : t
      )
    );
  }, []);

  const chips = [
    { id: "all", label: "All", count: filterCounts.all },
    { id: "open", label: "Open", count: filterCounts.open },
    { id: "overdue", label: "Overdue", count: filterCounts.overdue },
    { id: "done", label: "Completed", count: filterCounts.done },
  ];

  const hasActiveFilters =
    search.trim().length > 0 ||
    statusFilter !== "all" ||
    priorityFilter !== "all";

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  return (
    <>
      <TasksHeader />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <PremiumMetricCard
          title="Open"
          value={metrics.open}
          trend={4}
          loading={loading}
          delay={0}
        />
        <PremiumMetricCard
          title="Due today"
          value={metrics.dueToday}
          trend={metrics.dueToday > 0 ? 6 : 0}
          loading={loading}
          delay={0.05}
        />
        <PremiumMetricCard
          title="Overdue"
          value={metrics.overdue}
          trend={metrics.overdue > 0 ? -8 : 0}
          loading={loading}
          delay={0.1}
        />
        <PremiumMetricCard
          title="Completed"
          value={metrics.completed}
          trend={12}
          loading={loading}
          delay={0.15}
        />
      </div>

      <div className={`${dashboard.cardLg} p-4 sm:p-6 lg:p-8`}>
        {loading ? (
          <TasksContentSkeleton />
        ) : (
          <>
        <div className="mb-4">
          <CrmSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search tasks, assignees, companies, or tags…"
          />
        </div>

        <div className="mb-4">
          <CrmFilterChips
            chips={chips}
            activeId={statusFilter}
            onChange={(id) => setStatusFilter(id as TaskFilter)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <CrmSelectFilter
            label="Priority"
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={[
              { value: "all", label: "All priorities" },
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ]}
          />
          <CrmSelectFilter
            label="Sort"
            value={sort}
            onChange={(v) => setSort(v as TaskSort)}
            options={[
              { value: "due-date", label: "Due date" },
              { value: "priority", label: "Priority" },
              { value: "name-asc", label: "Name A → Z" },
            ]}
          />
        </div>

        <p className={`text-xs ${dashboard.subtle} mb-4 tabular-nums`}>
          {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
        </p>

        <TasksList
          tasks={filteredTasks}
          onToggleTask={handleToggleTask}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
          </>
        )}
      </div>
    </>
  );
}
