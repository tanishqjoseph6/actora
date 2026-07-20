import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { listStoredCalendarEvents } from "@/lib/calendar/meetings-store";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { mapMeetingRow, type MeetingInput } from "@/lib/meetings/live";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.email ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const events = await listStoredCalendarEvents(
    normalizeSubscriptionUserId(userId)
  );

  return NextResponse.json({
    meetings: events.map((event) =>
      mapMeetingRow({
        id: event.id,
        title: event.title,
        starts_at: event.startAt,
        ends_at: event.endAt,
        status: event.status,
        description: event.description,
        location: event.location,
        meeting_link: event.meetingLink,
        attendees: event.attendees.map((a) => a.email),
      })
    ),
  });
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
