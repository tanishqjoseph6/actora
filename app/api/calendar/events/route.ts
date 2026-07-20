import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { getCalendarAuthClient } from "@/lib/calendar/auth";
import { listStoredCalendarEvents } from "@/lib/calendar/meetings-store";
import { getCalendarProvider } from "@/lib/calendar/providers";
import { upsertSyncedMeetings } from "@/lib/calendar/sync";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import type { CreateCalendarEventInput } from "@/lib/calendar/types";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { mapMeetingRowToEvent } from "@/lib/calendar/meetings-store";
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

  const events = await listStoredCalendarEvents(userId, {
    from,
    to,
    contactEmail,
  });

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

  const auth = await getCalendarAuthClient(request);

  try {
    if (auth.ok) {
      const provider = getCalendarProvider(auth.account.provider);
      const remote = await provider.createEvent(auth.oauth2Client, {
        ...body,
        source: body.source ?? "ai",
      });
      await upsertSyncedMeetings(userId, [remote]);

      const events = await listStoredCalendarEvents(userId, {
        from: body.startAt,
        to: body.endAt,
      });
      const created =
        events.find((e) => e.externalId === remote.externalId) ?? remote;

      return NextResponse.json({ event: created }, { status: 201 });
    }

    // Local-only fallback when Calendar not connected
    const db = getSupabaseAdmin();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured." },
        { status: 503 }
      );
    }

    const { data, error } = await db
      .from("meetings")
      .insert({
        user_id: userId,
        title: body.title.trim(),
        description: body.description ?? null,
        location: body.location ?? null,
        meeting_link: null,
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

    if (error || !data) {
      // Legacy insert
      const legacy = await db
        .from("meetings")
        .insert({
          user_id: userId,
          title: body.title.trim(),
          starts_at: body.startAt,
          ends_at: body.endAt,
          status: "scheduled",
        })
        .select("id, title, starts_at, ends_at, status")
        .single();

      if (legacy.error || !legacy.data) {
        return NextResponse.json(
          { error: error?.message ?? legacy.error?.message ?? "Create failed." },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          event: mapMeetingRowToEvent({
            ...legacy.data,
            description: null,
            location: null,
            meeting_link: null,
            attendees: [],
            provider: null,
            external_id: null,
            source: "manual",
            contact_email: null,
            all_day: false,
          }),
        },
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
