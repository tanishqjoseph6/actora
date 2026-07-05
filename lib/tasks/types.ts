export type TaskPriority = "high" | "medium" | "low";

export type TaskStatus = "todo" | "in_progress" | "done";

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assignee: string;
  companyName?: string;
  tags: string[];
};

export type TaskFilter = "all" | "open" | "overdue" | "done";

export type TaskSort = "due-date" | "priority" | "name-asc";
