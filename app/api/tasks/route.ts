import { NextRequest, NextResponse } from "next/server";
import { tasksJsonError } from "@/lib/tasks/api-response";
import type { TaskInput } from "@/lib/tasks/live";
import {
  createTaskRecord,
  listTaskRecords,
  taskInputToUpdate,
} from "@/lib/tasks/repository";
import {
  requireTasksUserId,
  requireTasksWriteUserId,
} from "@/lib/tasks/session";
import { taskValidationError } from "@/lib/tasks/errors";

export async function GET(request: NextRequest) {
  const userId = await requireTasksUserId(request);
  if (userId instanceof NextResponse) return userId;

  const result = await listTaskRecords(userId, {
    excludeDone: false,
    orderByDueDate: true,
  });
  if (!result.ok) return tasksJsonError(result.error);

  return NextResponse.json({ tasks: result.data });
}

export async function POST(request: NextRequest) {
  const auth = await requireTasksWriteUserId(request);
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as TaskInput;
  const title = body.title?.trim();
  if (!title || !body.dueDate) {
    return tasksJsonError(
      taskValidationError(
        "MISSING_FIELDS",
        "Title and due date are required."
      )
    );
  }

  const result = await createTaskRecord({
    userId: auth,
    title,
    description: body.description,
    priority: body.priority,
    status: body.status,
    dueDate: body.dueDate,
    assignee: body.assignee,
    companyName: body.companyName,
    tags: body.tags,
  });

  if (!result.ok) return tasksJsonError(result.error);

  return NextResponse.json({ task: result.data }, { status: 201 });
}
