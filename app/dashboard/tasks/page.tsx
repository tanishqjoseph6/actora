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
import { ContentFade } from "@/components/ui/ContentFade";
import { ModalShell } from "@/components/ui/ModalShell";
import { useToast } from "@/providers/ToastProvider";
import { friendlyError } from "@/lib/errors/friendly";
import type { TaskInput } from "@/lib/tasks/live";
import type { Task, TaskFilter, TaskSort } from "@/lib/tasks/types";
import {
  computeTaskMetrics,
  filterTasks,
  isTaskOverdue,
  sortTasks,
} from "@/lib/tasks/utils";

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(17, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

export default function TasksPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sort, setSort] = useState<TaskSort>("due-date");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskInput>({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    dueDate: defaultDueDate(),
    assignee: "",
    companyName: "",
    tags: [],
  });

  useEffect(() => {
    void loadTasks();
  }, []);

  async function loadTasks() {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Could not load tasks.");
      }
      const json = (await res.json()) as { tasks?: Task[] };
      setTasks(json.tasks ?? []);
    } catch (err) {
      const friendly = friendlyError(err, "server");
      showToast({
        type: "error",
        title: friendly.title,
        message: friendly.message,
      });
    } finally {
      setLoading(false);
    }
  }

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

  const handleToggleTask = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      const nextStatus = task.status === "done" ? "todo" : "done";
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) return;
      const json = (await res.json()) as { task: Task };
      setTasks((prev) => prev.map((t) => (t.id === id ? json.task : t)));
    },
    [tasks]
  );

  function openCreate() {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      priority: "medium",
      status: "todo",
      dueDate: defaultDueDate(),
      assignee: "",
      companyName: "",
      tags: [],
    });
    setShowForm(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate.slice(0, 16),
      assignee: task.assignee,
      companyName: task.companyName ?? "",
      tags: task.tags,
    });
    setShowForm(true);
  }

  async function saveTask() {
    if (!form.title?.trim() || !form.dueDate) return;
    setSaving(true);
    const url = editing ? `/api/tasks/${editing.id}` : "/api/tasks";
    const method = editing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        priority: form.priority,
        status: form.status,
        dueDate: new Date(form.dueDate).toISOString(),
        assignee: form.assignee,
        companyName: form.companyName || undefined,
        tags: form.tags,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      const friendly = friendlyError(body.error ?? "Save failed.", "server");
      showToast({
        type: "error",
        title: friendly.title,
        message: friendly.message,
      });
      return;
    }

    setShowForm(false);
    await loadTasks();
  }

  async function deleteTask(task: Task) {
    const confirmed = window.confirm(`Delete "${task.title}"?`);
    if (!confirmed) return;
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    await loadTasks();
  }

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
      <TasksHeader onAddTask={openCreate} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <PremiumMetricCard title="Open" value={metrics.open} loading={loading} delay={0} />
        <PremiumMetricCard title="Due today" value={metrics.dueToday} loading={loading} delay={0.05} />
        <PremiumMetricCard title="Overdue" value={metrics.overdue} loading={loading} delay={0.1} />
        <PremiumMetricCard title="Completed" value={metrics.completed} loading={loading} delay={0.15} />
      </div>

      <div className={`${dashboard.cardLg} p-4 sm:p-6 lg:p-8`}>
        {loading ? (
          <TasksContentSkeleton />
        ) : (
          <ContentFade>
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
              onEditTask={openEdit}
              onDeleteTask={deleteTask}
              onAddTask={openCreate}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
            />
            </>
          </ContentFade>
        )}
      </div>

      <ModalShell
        open={showForm}
        onClose={() => setShowForm(false)}
        ariaLabelledBy="task-form-title"
        panelClassName={`${dashboard.panelLg} w-full max-w-xl`}
      >
        <h3 id="task-form-title" className="text-xl font-bold text-white mb-4">
          {editing ? "Edit task" : "Create task"}
        </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Task title"
                className={`${dashboard.input} px-3 py-2 sm:col-span-2`}
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Description"
                rows={3}
                className={`${dashboard.input} px-3 py-2 sm:col-span-2 resize-none`}
              />
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    priority: e.target.value as Task["priority"],
                  }))
                }
                className={`${dashboard.input} px-3 py-2`}
              >
                <option value="high">High priority</option>
                <option value="medium">Medium priority</option>
                <option value="low">Low priority</option>
              </select>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as Task["status"],
                  }))
                }
                className={`${dashboard.input} px-3 py-2`}
              >
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
              <input
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className={`${dashboard.input} px-3 py-2 sm:col-span-2`}
              />
              <input
                value={form.assignee ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
                placeholder="Assignee"
                className={`${dashboard.input} px-3 py-2`}
              />
              <input
                value={form.companyName ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                placeholder="Company (optional)"
                className={`${dashboard.input} px-3 py-2`}
              />
              <input
                value={(form.tags ?? []).join(", ")}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  }))
                }
                placeholder="Tags (comma-separated)"
                className={`${dashboard.input} px-3 py-2 sm:col-span-2`}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={`${dashboard.btnSecondary} px-4 py-2`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || !form.title?.trim()}
                onClick={() => void saveTask()}
                className={`${dashboard.btnPrimary} px-4 py-2 disabled:opacity-60`}
              >
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
            </div>
      </ModalShell>
    </>
  );
}
