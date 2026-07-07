import type { Task, TaskPriority, TaskStatus } from "./types";

export type TaskInput = {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate: string;
  assignee?: string;
  companyName?: string;
  tags?: string[];
};

export function mapTaskRow(row: {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string;
  assignee: string | null;
  company_name: string | null;
  tags: string[] | null;
}): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    priority: (row.priority as TaskPriority) ?? "medium",
    status: (row.status as TaskStatus) ?? "todo",
    dueDate: row.due_date,
    assignee: row.assignee ?? "",
    companyName: row.company_name ?? undefined,
    tags: row.tags ?? [],
  };
}

const TASK_SELECT =
  "id, title, description, priority, status, due_date, assignee, company_name, tags";

export { TASK_SELECT };
