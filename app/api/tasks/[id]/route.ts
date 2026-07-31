import { NextRequest, NextResponse } from "next/server";
import { tasksJsonError } from "@/lib/tasks/api-response";
import type { TaskInput } from "@/lib/tasks/live";
import {
  deleteTaskRecord,
  taskInputToUpdate,
  updateTaskRecord,
} from "@/lib/tasks/repository";
import { requireTasksWriteUserId } from "@/lib/tasks/session";
import { taskValidationError } from "@/lib/tasks/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await requireTasksWriteUserId(request);
  if (userId instanceof NextResponse) return userId;

  const { id } = await context.params;
  const body = (await request.json()) as TaskInput;

  if (body.title !== undefined && !body.title.trim()) {
    return tasksJsonError(
      taskValidationError("INVALID_TITLE", "Title cannot be empty.")
    );
  }

  const result = await updateTaskRecord(userId, id, taskInputToUpdate(body));
  if (!result.ok) return tasksJsonError(result.error);

  return NextResponse.json({ task: result.data });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const userId = await requireTasksWriteUserId(_request);
  if (userId instanceof NextResponse) return userId;

  const { id } = await context.params;
  const result = await deleteTaskRecord(userId, id);
  if (!result.ok) return tasksJsonError(result.error);

  return NextResponse.json({ deleted: true });
}
