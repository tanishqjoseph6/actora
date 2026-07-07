import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { mapTaskRow, TASK_SELECT, type TaskInput } from "@/lib/tasks/live";

type RouteContext = { params: Promise<{ id: string }> };

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.email ?? null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as TaskInput;
  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json({ error: "Title cannot be empty." }, { status: 400 });
    }
    updates.title = title;
  }
  if (body.description !== undefined) updates.description = body.description.trim();
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.status !== undefined) updates.status = body.status;
  if (body.dueDate !== undefined) updates.due_date = body.dueDate;
  if (body.assignee !== undefined) updates.assignee = body.assignee.trim();
  if (body.companyName !== undefined) {
    updates.company_name = body.companyName.trim() || null;
  }
  if (body.tags !== undefined) updates.tags = body.tags;

  const { data, error } = await db
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select(TASK_SELECT)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  return NextResponse.json({ task: mapTaskRow(data) });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { id } = await context.params;
  const { error } = await db.from("tasks").delete().eq("id", id).eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: true });
}
