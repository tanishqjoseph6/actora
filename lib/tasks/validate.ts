import type { TaskPriority, TaskStatus } from "./types";

const PRIORITIES = new Set<TaskPriority>(["high", "medium", "low"]);
const STATUSES = new Set<TaskStatus>(["todo", "in_progress", "done"]);

export type TaskValidationError = {
  code: string;
  message: string;
};

export function validateTaskUserId(userId: string): TaskValidationError | null {
  const trimmed = userId.trim();
  if (!trimmed) {
    return { code: "INVALID_USER", message: "A signed-in user is required." };
  }
  if (!trimmed.includes("@")) {
    return { code: "INVALID_USER", message: "Invalid user identity." };
  }
  return null;
}

export function validateTaskTitle(title: string): TaskValidationError | null {
  const trimmed = title.trim();
  if (!trimmed) {
    return { code: "INVALID_TITLE", message: "Task title is required." };
  }
  if (trimmed.length > 500) {
    return {
      code: "INVALID_TITLE",
      message: "Task title must be 500 characters or fewer.",
    };
  }
  return null;
}

export function validateTaskPriority(
  priority: string | undefined
): TaskValidationError | null {
  if (priority === undefined) return null;
  if (!PRIORITIES.has(priority as TaskPriority)) {
    return { code: "INVALID_PRIORITY", message: "Invalid task priority." };
  }
  return null;
}

export function validateTaskStatus(
  status: string | undefined
): TaskValidationError | null {
  if (status === undefined) return null;
  if (!STATUSES.has(status as TaskStatus)) {
    return { code: "INVALID_STATUS", message: "Invalid task status." };
  }
  return null;
}

export function validateTaskDueDate(
  dueDate: string | undefined
): TaskValidationError | null {
  if (dueDate === undefined) return null;
  const parsed = Date.parse(dueDate);
  if (Number.isNaN(parsed)) {
    return { code: "INVALID_DUE_DATE", message: "Invalid due date." };
  }
  return null;
}

export function resolveDueDate(input: {
  dueDate?: string;
  dueInDays?: number;
}): string {
  if (input.dueDate) {
    const parsed = Date.parse(input.dueDate);
    if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  }
  const days =
    typeof input.dueInDays === "number" && Number.isFinite(input.dueInDays)
      ? Math.max(0, Math.floor(input.dueInDays))
      : 1;
  return new Date(Date.now() + days * 24 * 60 * 60_000).toISOString();
}
