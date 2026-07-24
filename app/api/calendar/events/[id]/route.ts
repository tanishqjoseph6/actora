import { NextRequest, NextResponse } from "next/server";
import { requireWritableWorkspacePermission } from "@/lib/workspace/require";
import { getCalendarAuthClient } from "@/lib/calendar/auth";
import {
  listStoredCalendarEvents,
  mapMeetingRowToEvent,
} from "@/lib/calendar/meetings-store";
import { getCalendarProvider } from "@/lib/calendar/providers";
import { upsertSyncedMeetings } from "@/lib/calendar/sync";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import type { UpdateCalendarEventInput } from "@/lib/calendar/types";
import { logApiError } from "@/lib/api/log-error";

type Ctx = { params: Promise<{ id: string }> };

async function loadMeeting(userId: string, id: string) {
  const events = await listStoredCalendarEvents(userId);
  return events.find((e) => e.id === id) ?? null;
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const wsAuth = await requireWritableWorkspacePermission("calendar", request);
  if (!wsAuth.ok) return wsAuth.response;

  const { id } = await context.params;
  const userId = normalizeSubscriptionUserId(wsAuth.email);
  const body = (await request.json()) as UpdateCalendarEventInput;
  const existing = await loadMeeting(userId, id);

  if (!existing) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  try {
    const auth = await getCalendarAuthClient(request);

    if (auth.ok && existing.externalId && existing.provider) {
      const provider = getCalendarProvider(existing.provider);
      const remote = await provider.updateEvent(
        auth.oauth2Client,
        existing.externalId,
        body
      );
      remote.notes = body.notes ?? existing.notes;
      if (body.reminderMinutes !== undefined) {
        remote.reminderMinutes = body.reminderMinutes;
      }
      await upsertSyncedMeetings(userId, [remote]);

      const dbAfter = getSupabaseAdmin();
      if (dbAfter) {
        const extra: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (body.notes !== undefined) extra.notes = body.notes;
        if (body.reminderMinutes !== undefined) {
          extra.reminder_minutes = body.reminderMinutes;
          extra.reminder_sent_at = null;
        }
        if (body.startAt !== undefined) extra.reminder_sent_at = null;
        await dbAfter
          .from("meetings")
          .update(extra)
          .eq("id", id)
          .eq("user_id", userId);
      }

      const updated = (await listStoredCalendarEvents(userId)).find(
        (e) => e.id === id || e.externalId === remote.externalId
      );
      return NextResponse.json({ event: updated ?? remote });
    }

    const db = getSupabaseAdmin();
    if (!db) {
      return NextResponse.json({ error: "Database not configured." }, { status: 503 });
    }

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (body.title !== undefined) patch.title = body.title;
    if (body.description !== undefined) patch.description = body.description;
    if (body.notes !== undefined) patch.notes = body.notes;
    if (body.location !== undefined) patch.location = body.location;
    if (body.startAt !== undefined) {
      patch.starts_at = body.startAt;
      patch.reminder_sent_at = null;
    }
    if (body.endAt !== undefined) patch.ends_at = body.endAt;
    if (body.status !== undefined) patch.status = body.status;
    if (body.reminderMinutes !== undefined) {
      patch.reminder_minutes = body.reminderMinutes;
      patch.reminder_sent_at = null;
    }
    if (body.attendees !== undefined) {
      patch.attendees = body.attendees.map((e) => ({ email: e }));
    }

    const { data, error } = await db
      .from("meetings")
      .update(patch)
      .eq("id", id)
      .eq("user_id", userId)
      .select(
        "id, title, description, notes, location, meeting_link, attendees, starts_at, ends_at, status, provider, external_id, source, contact_email, all_day, reminder_minutes, reminder_sent_at"
      )
      .maybeSingle();

    if (error || !data) {
      // Fallback without notes/reminder columns
      const legacyPatch = { ...patch };
      delete legacyPatch.notes;
      delete legacyPatch.reminder_minutes;
      delete legacyPatch.reminder_sent_at;
      const legacy = await db
        .from("meetings")
        .update(legacyPatch)
        .eq("id", id)
        .eq("user_id", userId)
        .select(
          "id, title, description, location, meeting_link, attendees, starts_at, ends_at, status, provider, external_id, source, contact_email, all_day"
        )
        .maybeSingle();

      if (legacy.error || !legacy.data) {
        return NextResponse.json(
          { error: error?.message ?? legacy.error?.message ?? "Update failed." },
          { status: 500 }
        );
      }
      return NextResponse.json({ event: mapMeetingRowToEvent(legacy.data) });
    }

    return NextResponse.json({ event: mapMeetingRowToEvent(data) });
  } catch (error) {
    logApiError("calendar/events/[id]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update event.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: Ctx) {
  const wsAuth = await requireWritableWorkspacePermission("calendar", request);
  if (!wsAuth.ok) return wsAuth.response;

  const { id } = await context.params;
  const userId = normalizeSubscriptionUserId(wsAuth.email);
  const existing = await loadMeeting(userId, id);

  if (!existing) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  try {
    const auth = await getCalendarAuthClient(request);
    if (auth.ok && existing.externalId && existing.provider) {
      const provider = getCalendarProvider(existing.provider);
      if (existing.status !== "cancelled") {
        await provider.deleteEvent(auth.oauth2Client, existing.externalId);
      }
    }

    const db = getSupabaseAdmin();
    if (db) {
      await db.from("meetings").delete().eq("id", id).eq("user_id", userId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logApiError("calendar/events/[id] DELETE", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to cancel event.",
      },
      { status: 500 }
    );
  }
}
