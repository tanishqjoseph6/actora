import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCalendarProvider } from "@/lib/calendar/providers";
import { calendarAccountRepository } from "@/lib/calendar/repository";
import {
  listLocalUnsyncedMeetings,
  mapMeetingRowToEvent,
} from "@/lib/calendar/meetings-store";
import { processMeetingReminders } from "@/lib/calendar/reminders";
import type { google } from "googleapis";
import type { CalendarAccountRecord, CalendarEvent } from "@/lib/calendar/types";

type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;

function attendeesJson(event: CalendarEvent) {
  return event.attendees.map((a) => ({
    email: a.email,
    name: a.name,
    responseStatus: a.responseStatus,
  }));
}

export async function upsertSyncedMeetings(
  userId: string,
  events: CalendarEvent[]
): Promise<number> {
  const db = getSupabaseAdmin();
  if (!db) return 0;

  let count = 0;
  for (const event of events) {
    if (!event.externalId || !event.provider) continue;

    const row = {
      user_id: userId,
      title: event.title,
      description: event.description || null,
      notes: event.notes || "",
      location: event.location ?? null,
      meeting_link: event.meetingLink ?? null,
      attendees: attendeesJson(event),
      starts_at: event.startAt,
      ends_at: event.endAt,
      status: event.status,
      provider: event.provider,
      external_id: event.externalId,
      source: event.source === "google" ? "google" : event.source,
      contact_email: event.contactEmail ?? null,
      all_day: event.allDay,
      reminder_minutes: event.reminderMinutes ?? 30,
      updated_at: new Date().toISOString(),
    };

    const { error } = await db.from("meetings").upsert(row, {
      onConflict: "user_id,provider,external_id",
    });

    if (error) {
      const existing = await db
        .from("meetings")
        .select("id")
        .eq("user_id", userId)
        .eq("provider", event.provider)
        .eq("external_id", event.externalId)
        .maybeSingle();

      if (existing.data?.id) {
        const { notes: _n, reminder_minutes: _r, ...legacyRow } = row;
        void _n;
        void _r;
        const updated = await db
          .from("meetings")
          .update(row)
          .eq("id", existing.data.id);
        if (updated.error) {
          await db.from("meetings").update(legacyRow).eq("id", existing.data.id);
        }
      } else {
        const insert = await db.from("meetings").insert(row);
        if (insert.error) {
          const { notes: _n, reminder_minutes: _r, ...legacyRow } = row;
          void _n;
          void _r;
          const legacyInsert = await db.from("meetings").insert(legacyRow);
          if (legacyInsert.error) {
            console.error("[calendar/sync] upsert failed", insert.error);
            continue;
          }
        }
      }
    }
    count += 1;
  }

  return count;
}

/** Push local-only Actora meetings up to Google (two-way sync). */
export async function pushLocalMeetingsToGoogle(
  userId: string,
  account: CalendarAccountRecord,
  oauth2Client: OAuth2Client
): Promise<number> {
  const db = getSupabaseAdmin();
  if (!db) return 0;

  const provider = getCalendarProvider(account.provider);
  const local = await listLocalUnsyncedMeetings(userId);
  let pushed = 0;

  for (const meeting of local) {
    try {
      const remote = await provider.createEvent(oauth2Client, {
        title: meeting.title,
        description: meeting.description,
        notes: meeting.notes,
        startAt: meeting.startAt,
        endAt: meeting.endAt,
        attendees: meeting.attendees.map((a) => a.email),
        location: meeting.location,
        addMeetLink: !meeting.meetingLink,
        reminderMinutes: meeting.reminderMinutes,
        contactEmail: meeting.contactEmail ?? undefined,
        source: meeting.source,
      });

      await db
        .from("meetings")
        .update({
          provider: account.provider,
          external_id: remote.externalId,
          meeting_link: remote.meetingLink ?? meeting.meetingLink ?? null,
          source: meeting.source === "manual" ? "google" : meeting.source,
          updated_at: new Date().toISOString(),
        })
        .eq("id", meeting.id)
        .eq("user_id", userId);

      pushed += 1;
    } catch (error) {
      console.error("[calendar/sync] push local failed", meeting.id, error);
    }
  }

  return pushed;
}

export async function syncCalendarAccount(
  userId: string,
  account: CalendarAccountRecord,
  oauth2Client: OAuth2Client,
  options?: { daysBack?: number; daysForward?: number }
): Promise<{
  syncedCount: number;
  pushedCount: number;
  remindersSent: number;
  events: CalendarEvent[];
}> {
  const provider = getCalendarProvider(account.provider);
  const daysBack = options?.daysBack ?? 14;
  const daysForward = options?.daysForward ?? 60;

  const timeMin = new Date();
  timeMin.setDate(timeMin.getDate() - daysBack);
  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + daysForward);

  // Push local → Google, then pull Google → local
  const pushedCount = await pushLocalMeetingsToGoogle(
    userId,
    account,
    oauth2Client
  );

  const events = await provider.listEvents(oauth2Client, {
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
  });

  const syncedCount = await upsertSyncedMeetings(userId, events);
  await calendarAccountRepository.markSynced(
    userId,
    account.provider,
    account.accountEmail,
    syncedCount
  );

  const { sent: remindersSent } = await processMeetingReminders(userId);

  return { syncedCount, pushedCount, remindersSent, events };
}

export { mapMeetingRowToEvent };
