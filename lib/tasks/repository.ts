import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getMembershipContext } from "@/lib/workspace/repository";
import { resolveActiveWorkspace } from "@/lib/workspace/require";
import {
  mapTaskDbError,
  taskNotConfiguredError,
  taskNotFoundError,
  taskValidationError,
  type TaskServiceError,
} from "./errors";
import { mapTaskRow, TASK_SELECT, type TaskInput } from "./live";
import type { Task, TaskPriority, TaskStatus } from "./types";
import {
  resolveDueDate,
  validateTaskDueDate,
  validateTaskPriority,
  validateTaskStatus,
  validateTaskTitle,
  validateTaskUserId,
} from "./validate";

export type CreateTaskInput = {
  userId: string;
  workspaceId?: string | null;
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  dueInDays?: number;
  assignee?: string;
  companyName?: string | null;
  tags?: string[];
};

export type UpdateTaskInput = Partial<
  Omit<CreateTaskInput, "userId" | "workspaceId" | "dueInDays">
> & {
  dueDate?: string;
};

export type TaskResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: TaskServiceError };

async function resolveWorkspaceIdForUser(
  userId: string,
  workspaceId?: string | null
): Promise<string | null | TaskServiceError> {
  if (workspaceId) {
    const membership = await getMembershipContext(workspaceId, userId);
    if (!membership) {
      return taskValidationError(
        "INVALID_WORKSPACE",
        "You do not have access to this workspace."
      );
    }
    return workspaceId;
  }

  try {
    const ctx = await resolveActiveWorkspace(userId);
    return ctx.workspaceId;
  } catch {
    return null;
  }
}

function validateCreateInput(input: CreateTaskInput): TaskServiceError | null {
  const userErr = validateTaskUserId(input.userId);
  if (userErr) return taskValidationError(userErr.code, userErr.message);

  const titleErr = validateTaskTitle(input.title);
  if (titleErr) return taskValidationError(titleErr.code, titleErr.message);

  const priorityErr = validateTaskPriority(input.priority);
  if (priorityErr) return taskValidationError(priorityErr.code, priorityErr.message);

  const statusErr = validateTaskStatus(input.status);
  if (statusErr) return taskValidationError(statusErr.code, statusErr.message);

  const dueErr = validateTaskDueDate(input.dueDate);
  if (dueErr) return taskValidationError(dueErr.code, dueErr.message);

  return null;
}

export async function createTaskRecord(
  input: CreateTaskInput
): Promise<TaskResult<Task>> {
  const validationError = validateCreateInput(input);
  if (validationError) return { ok: false, error: validationError };

  const db = getSupabaseAdmin();
  if (!db) return { ok: false, error: taskNotConfiguredError("tasks/create") };

  const workspaceResult = await resolveWorkspaceIdForUser(
    input.userId,
    input.workspaceId
  );
  if (
    workspaceResult !== null &&
    typeof workspaceResult === "object" &&
    "code" in workspaceResult &&
    "status" in workspaceResult
  ) {
    return { ok: false, error: workspaceResult };
  }

  const dueDate = resolveDueDate({
    dueDate: input.dueDate,
    dueInDays: input.dueInDays,
  });

  const { data, error } = await db
    .from("tasks")
    .insert({
      user_id: input.userId,
      workspace_id: workspaceResult,
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      priority: input.priority ?? "medium",
      status: input.status ?? "todo",
      due_date: dueDate,
      assignee: input.assignee?.trim() ?? "",
      company_name: input.companyName?.trim() || null,
      tags: input.tags ?? [],
    })
    .select(TASK_SELECT)
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: mapTaskDbError("tasks/create", error ?? { message: "Insert failed" }, {
        userId: input.userId,
      }),
    };
  }

  return { ok: true, data: mapTaskRow(data) };
}

export async function listTaskRecords(
  userId: string,
  options?: {
    workspaceId?: string | null;
    excludeDone?: boolean;
    limit?: number;
    orderByDueDate?: boolean;
  }
): Promise<TaskResult<Task[]>> {
  const userErr = validateTaskUserId(userId);
  if (userErr) return { ok: false, error: taskValidationError(userErr.code, userErr.message) };

  const db = getSupabaseAdmin();
  if (!db) return { ok: false, error: taskNotConfiguredError("tasks/list") };

  let query = db.from("tasks").select(TASK_SELECT).eq("user_id", userId);

  if (options?.workspaceId) {
    query = query.eq("workspace_id", options.workspaceId);
  }
  if (options?.excludeDone !== false) {
    query = query.neq("status", "done");
  }
  if (options?.orderByDueDate !== false) {
    query = query.order("due_date", { ascending: true });
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) {
    return {
      ok: false,
      error: mapTaskDbError("tasks/list", error, { userId }),
    };
  }

  return { ok: true, data: (data ?? []).map((row) => mapTaskRow(row)) };
}

export async function updateTaskRecord(
  userId: string,
  taskId: string,
  input: UpdateTaskInput
): Promise<TaskResult<Task>> {
  const userErr = validateTaskUserId(userId);
  if (userErr) return { ok: false, error: taskValidationError(userErr.code, userErr.message) };

  if (input.title !== undefined) {
    const titleErr = validateTaskTitle(input.title);
    if (titleErr) return { ok: false, error: taskValidationError(titleErr.code, titleErr.message) };
  }
  if (input.priority !== undefined) {
    const priorityErr = validateTaskPriority(input.priority);
    if (priorityErr) {
      return { ok: false, error: taskValidationError(priorityErr.code, priorityErr.message) };
    }
  }
  if (input.status !== undefined) {
    const statusErr = validateTaskStatus(input.status);
    if (statusErr) return { ok: false, error: taskValidationError(statusErr.code, statusErr.message) };
  }
  if (input.dueDate !== undefined) {
    const dueErr = validateTaskDueDate(input.dueDate);
    if (dueErr) return { ok: false, error: taskValidationError(dueErr.code, dueErr.message) };
  }

  const db = getSupabaseAdmin();
  if (!db) return { ok: false, error: taskNotConfiguredError("tasks/update") };

  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.description !== undefined) updates.description = input.description.trim();
  if (input.priority !== undefined) updates.priority = input.priority;
  if (input.status !== undefined) updates.status = input.status;
  if (input.dueDate !== undefined) updates.due_date = input.dueDate;
  if (input.assignee !== undefined) updates.assignee = input.assignee.trim();
  if (input.companyName !== undefined) {
    updates.company_name = input.companyName?.trim() || null;
  }
  if (input.tags !== undefined) updates.tags = input.tags;

  const { data, error } = await db
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .eq("user_id", userId)
    .select(TASK_SELECT)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: mapTaskDbError("tasks/update", error, { userId, taskId }),
    };
  }
  if (!data) return { ok: false, error: taskNotFoundError() };

  return { ok: true, data: mapTaskRow(data) };
}

export async function deleteTaskRecord(
  userId: string,
  taskId: string
): Promise<TaskResult<{ deleted: true }>> {
  const userErr = validateTaskUserId(userId);
  if (userErr) return { ok: false, error: taskValidationError(userErr.code, userErr.message) };

  const db = getSupabaseAdmin();
  if (!db) return { ok: false, error: taskNotConfiguredError("tasks/delete") };

  const { data, error } = await db
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: mapTaskDbError("tasks/delete", error, { userId, taskId }),
    };
  }
  if (!data) return { ok: false, error: taskNotFoundError() };

  return { ok: true, data: { deleted: true } };
}

/** Map API TaskInput to repository update payload. */
export function taskInputToUpdate(input: TaskInput): UpdateTaskInput {
  return {
    title: input.title,
    description: input.description,
    priority: input.priority,
    status: input.status,
    dueDate: input.dueDate,
    assignee: input.assignee,
    companyName: input.companyName,
    tags: input.tags,
  };
}

/** Lightweight list for AI context — returns [] on schema errors. */
export async function listTasksForContext(
  userId: string,
  limit = 15
): Promise<
  { id: string; title: string; status: string; dueDate: string; priority: string }[]
> {
  const result = await listTaskRecords(userId, { limit, excludeDone: true });
  if (!result.ok) return [];
  return result.data.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    dueDate: t.dueDate,
    priority: t.priority,
  }));
}

export type TaskAnalyticsRow = {
  id: string;
  status: string;
  due_date: string;
  updated_at: string;
  created_at: string;
};

/** Analytics snapshot rows — returns [] when tasks schema is unavailable. */
export async function fetchTaskAnalyticsRows(
  userId: string
): Promise<TaskAnalyticsRow[]> {
  const userErr = validateTaskUserId(userId);
  if (userErr) return [];

  const db = getSupabaseAdmin();
  if (!db) return [];

  const { data, error } = await db
    .from("tasks")
    .select("id, status, due_date, updated_at, created_at")
    .eq("user_id", userId);

  if (error) {
    mapTaskDbError("tasks/analytics", error, { userId });
    return [];
  }

  return (data ?? []) as TaskAnalyticsRow[];
}

/** Search tasks by title, description, or company — returns [] on schema errors. */
export async function searchTaskRecords(
  userId: string,
  query: string,
  limit = 5
): Promise<Task[]> {
  const userErr = validateTaskUserId(userId);
  if (userErr) return [];

  const db = getSupabaseAdmin();
  if (!db) return [];

  const sanitized = query.replace(/[%_\\]/g, "").trim();
  if (!sanitized) return [];

  const ilike = `%${sanitized}%`;
  const { data, error } = await db
    .from("tasks")
    .select(TASK_SELECT)
    .eq("user_id", userId)
    .or(
      `title.ilike.${ilike},description.ilike.${ilike},company_name.ilike.${ilike}`
    )
    .limit(limit);

  if (error) {
    mapTaskDbError("tasks/search", error, { userId, query });
    return [];
  }

  return (data ?? []).map((row) => mapTaskRow(row));
}
