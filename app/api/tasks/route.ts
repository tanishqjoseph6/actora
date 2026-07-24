import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { mapTaskRow, TASK_SELECT, type TaskInput } from "@/lib/tasks/live";
import {
  requireTasksUserId,
  requireTasksWriteUserId,
} from "@/lib/tasks/session";

export async function GET(request: NextRequest) {
  const userId = await requireTasksUserId(request);
  if (userId instanceof NextResponse) return userId;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { data, error } = await db
    .from("tasks")
    .select(TASK_SELECT)
    .eq("user_id", userId)
    .order("due_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ tasks: (data ?? []).map((row) => mapTaskRow(row)) });
}

export async function POST(request: NextRequest) {
  const userId = await requireTasksWriteUserId(request);
  if (userId instanceof NextResponse) return userId;

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const body = (await request.json()) as TaskInput;
  const title = body.title?.trim();
  if (!title || !body.dueDate) {
    return NextResponse.json(
      { error: "Title and due date are required." },
      { status: 400 }
    );
  }

  const { data, error } = await db
    .from("tasks")
    .insert({
      user_id: userId,
      title,
      description: body.description?.trim() ?? "",
      priority: body.priority ?? "medium",
      status: body.status ?? "todo",
      due_date: body.dueDate,
      assignee: body.assignee?.trim() ?? "",
      company_name: body.companyName?.trim() || null,
      tags: body.tags ?? [],
    })
    .select(TASK_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ task: mapTaskRow(data) }, { status: 201 });
}
