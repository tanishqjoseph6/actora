import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { mapMeetingRow, type MeetingInput } from "@/lib/meetings/live";

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
  const body = (await request.json()) as MeetingInput;
  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.startAt !== undefined) updates.starts_at = body.startAt;
  if (body.endAt !== undefined) updates.ends_at = body.endAt;
  if (body.status !== undefined) updates.status = body.status;

  const { data, error } = await db
    .from("meetings")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, title, starts_at, ends_at, status")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Meeting not found." }, { status: 404 });

  return NextResponse.json({ meeting: mapMeetingRow(data) });
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
  const { error } = await db
    .from("meetings")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: true });
}
