import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { mapMeetingRow, type MeetingInput } from "@/lib/meetings/live";

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.email ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ meetings: [] });

  const { data, error } = await db
    .from("meetings")
    .select("id, title, starts_at, ends_at, status")
    .eq("user_id", userId)
    .order("starts_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ meetings: (data ?? []).map((row) => mapMeetingRow(row)) });
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const body = (await request.json()) as MeetingInput;
  const title = body.title?.trim();
  if (!title || !body.startAt || !body.endAt) {
    return NextResponse.json(
      { error: "Title, start time, and end time are required." },
      { status: 400 }
    );
  }

  const { data, error } = await db
    .from("meetings")
    .insert({
      user_id: userId,
      title,
      starts_at: body.startAt,
      ends_at: body.endAt,
      status: body.status ?? "scheduled",
    })
    .select("id, title, starts_at, ends_at, status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ meeting: mapMeetingRow(data) }, { status: 201 });
}
