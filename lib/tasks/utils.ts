import type { Task, TaskFilter, TaskPriority, TaskSort } from "./types";

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export const PRIORITY_STYLES: Record<
  TaskPriority,
  { label: string; badge: string }
> = {
  high: {
    label: "High",
    badge: "bg-[#2563EB]/15 border-[#2563EB]/40 text-[#93C5FD]",
  },
  medium: {
    label: "Medium",
    badge: "bg-[#1E293B] border-[#334155] text-[#94A3B8]",
  },
  low: {
    label: "Low",
    badge: "bg-[#0B1220] border-[#1E293B] text-[#64748B]",
  },
};

export function isTaskOverdue(task: Task, today = new Date()): boolean {
  if (task.status === "done") return false;
  return startOfDay(new Date(task.dueDate)).getTime() < startOfDay(today).getTime();
}

export function isTaskDueToday(task: Task, today = new Date()): boolean {
  if (task.status === "done") return false;
  return isSameDay(new Date(task.dueDate), today);
}

export function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function getDueLabel(task: Task, today = new Date()): string {
  const due = startOfDay(new Date(task.dueDate));
  const t = startOfDay(today);
  const diff = Math.round((due.getTime() - t.getTime()) / 86_400_000);

  if (task.status === "done") return formatDueDate(task.dueDate);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff <= 7) return `In ${diff} days`;
  return formatDueDate(task.dueDate);
}

export function getDueTone(
  task: Task,
  today = new Date()
): "overdue" | "today" | "upcoming" | "done" {
  if (task.status === "done") return "done";
  if (isTaskOverdue(task, today)) return "overdue";
  if (isTaskDueToday(task, today)) return "today";
  return "upcoming";
}

export function filterTasks(
  tasks: Task[],
  {
    search,
    statusFilter,
    priority,
  }: {
    search: string;
    statusFilter: TaskFilter;
    priority: string;
  }
): Task[] {
  const q = search.trim().toLowerCase();
  const today = new Date();

  return tasks.filter((task) => {
    if (priority !== "all" && task.priority !== priority) return false;

    if (statusFilter === "open" && task.status === "done") return false;
    if (statusFilter === "done" && task.status !== "done") return false;
    if (statusFilter === "overdue" && !isTaskOverdue(task, today)) return false;

    if (!q) return true;
    return (
      task.title.toLowerCase().includes(q) ||
      task.description.toLowerCase().includes(q) ||
      task.assignee.toLowerCase().includes(q) ||
      (task.companyName?.toLowerCase().includes(q) ?? false) ||
      task.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}

export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  const list = [...tasks];
  switch (sort) {
    case "due-date":
      return list.sort(
        (a, b) =>
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
    case "priority":
      return list.sort(
        (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      );
    case "name-asc":
      return list.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return list;
  }
}

export type TaskGroup = {
  id: string;
  label: string;
  tasks: Task[];
};

export function groupTasks(tasks: Task[], today = new Date()): TaskGroup[] {
  const overdue: Task[] = [];
  const dueToday: Task[] = [];
  const upcoming: Task[] = [];
  const completed: Task[] = [];

  for (const task of tasks) {
    if (task.status === "done") {
      completed.push(task);
      continue;
    }
    if (isTaskOverdue(task, today)) {
      overdue.push(task);
    } else if (isTaskDueToday(task, today)) {
      dueToday.push(task);
    } else {
      upcoming.push(task);
    }
  }

  const groups: TaskGroup[] = [];
  if (overdue.length) groups.push({ id: "overdue", label: "Overdue", tasks: overdue });
  if (dueToday.length) groups.push({ id: "today", label: "Due today", tasks: dueToday });
  if (upcoming.length) groups.push({ id: "upcoming", label: "Upcoming", tasks: upcoming });
  if (completed.length) groups.push({ id: "done", label: "Completed", tasks: completed });

  return groups;
}

export function computeTaskMetrics(tasks: Task[], today = new Date()) {
  const open = tasks.filter((t) => t.status !== "done");
  const done = tasks.filter((t) => t.status === "done");
  const dueToday = open.filter((t) => isTaskDueToday(t, today));
  const overdue = open.filter((t) => isTaskOverdue(t, today));

  return {
    open: open.length,
    dueToday: dueToday.length,
    overdue: overdue.length,
    completed: done.length,
  };
}
