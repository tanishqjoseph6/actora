import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { getCalendarAuthClient } from "@/lib/calendar/auth";
import {
  listStoredCalendarEvents,
  mapMeetingRowToEvent,
  MEETING_SELECT_COLS,
} from "@/lib/calendar/meetings-store";
import { getCalendarProvider } from "@/lib/calendar/providers";
import { processMeetingReminders } from "@/lib/calendar/reminders";
import { upsertSyncedMeetings } from "@/lib/calendar/sync";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import type { CreateCalendarEventInput } from "@/lib/calendar/types";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logApiError } from "@/lib/api/log-error";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = normalizeSubscriptionUserId(email);
  const from = request.nextUrl.searchParams.get("from") ?? undefined;
  const to = request.nextUrl.searchParams.get("to") ?? undefined;
  const contactEmail =
    request.nextUrl.searchParams.get("contactEmail") ?? undefined;

  const [events] = await Promise.all([
    listStoredCalendarEvents(userId, { from, to, contactEmail }),
    processMeetingReminders(userId),
  ]);

  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const userId = normalizeSubscriptionUserId(email);
  const body = (await request.json()) as CreateCalendarEventInput;

  if (!body.title?.trim() || !body.startAt || !body.endAt) {
    return NextResponse.json(
      { error: "Title, start time, and end time are required." },
      { status: 400 }
    );
  }

  const reminderMinutes =
    typeof body.reminderMinutes === "number" ? body.reminderMinutes : 30;

  const auth = await getCalendarAuthClient(request);

  try {
    if (auth.ok) {
      const provider = getCalendarProvider(auth.account.provider);
      const remote = await provider.createEvent(auth.oauth2Client, {
        ...body,
        reminderMinutes,
        source: body.source ?? "ai",
      });
      remote.notes = body.notes ?? "";
      remote.reminderMinutes = reminderMinutes;
      await upsertSyncedMeetings(userId, [remote]);

      const db = getSupabaseAdmin();
      if (db && remote.externalId) {
        await db
          .from("meetings")
          .update({
            notes: body.notes ?? "",
            reminder_minutes: reminderMinutes,
            reminder_sent_at: null,
          })
          .eq("user_id", userId)
          .eq("external_id", remote.externalId);
      }

      const events = await listStoredCalendarEvents(userId, {
        from: body.startAt,
        to: body.endAt,
      });
      const created =
        events.find((e) => e.externalId === remote.externalId) ?? remote;

      return NextResponse.json({ event: created }, { status: 201 });
    }

    const db = getSupabaseAdmin();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured." },
        { status: 503 }
      );
    }

    const insertRow = {
      user_id: userId,
      title: body.title.trim(),
      description: body.description ?? null,
      notes: body.notes ?? "",
      location: body.location ?? null,
      meeting_link: null,
      attendees: (body.attendees ?? []).map((e) => ({ email: e })),
      starts_at: body.startAt,
      ends_at: body.endAt,
      status: "scheduled",
      source: body.source ?? "manual",
      contact_email: body.contactEmail ?? body.attendees?.[0] ?? null,
      all_day: false,
      reminder_minutes: reminderMinutes,
      reminder_sent_at: null,
    };

    const { data, error } = await db
      .from("meetings")
      .insert(insertRow)
      .select(MEETING_SELECT_COLS)
      .single();

    if (error || !data) {
      const legacy = await db
        .from("meetings")
        .insert({
          user_id: userId,
          title: body.title.trim(),
          description: body.description ?? null,
          location: body.location ?? null,
          attendees: (body.attendees ?? []).map((e) => ({ email: e })),
          starts_at: body.startAt,
          ends_at: body.endAt,
          status: "scheduled",
          source: body.source ?? "manual",
          contact_email: body.contactEmail ?? body.attendees?.[0] ?? null,
          all_day: false,
        })
        .select(
          "id, title, description, location, meeting_link, attendees, starts_at, ends_at, status, provider, external_id, source, contact_email, all_day"
        )
        .single();

      if (legacy.error || !legacy.data) {
        return NextResponse.json(
          {
            error:
              error?.message ?? legacy.error?.message ?? "Create failed.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { event: mapMeetingRowToEvent(legacy.data) },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { event: mapMeetingRowToEvent(data) },
      { status: 201 }
    );
  } catch (error) {
    logApiError("calendar/events", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create event.",
      },
      { status: 500 }
    );
  }
}
