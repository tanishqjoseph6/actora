import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCalendarProvider } from "@/lib/calendar/providers";
import { calendarAccountRepository } from "@/lib/calendar/repository";
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
      location: event.location ?? null,
      meeting_link: event.meetingLink ?? null,
      attendees: attendeesJson(event),
      starts_at: event.startAt,
      ends_at: event.endAt,
      status: event.status,
      provider: event.provider,
      external_id: event.externalId,
      source: event.source,
      contact_email: event.contactEmail ?? null,
      all_day: event.allDay,
      updated_at: new Date().toISOString(),
    };

    const { error } = await db.from("meetings").upsert(row, {
      onConflict: "user_id,provider,external_id",
    });

    if (error) {
      // Unique index name may differ before migration — fall back to insert/update.
      const existing = await db
        .from("meetings")
        .select("id")
        .eq("user_id", userId)
        .eq("provider", event.provider)
        .eq("external_id", event.externalId)
        .maybeSingle();

      if (existing.data?.id) {
        await db.from("meetings").update(row).eq("id", existing.data.id);
      } else {
        const insert = await db.from("meetings").insert(row);
        if (insert.error) {
          console.error("[calendar/sync] upsert failed", insert.error);
          continue;
        }
      }
    }
    count += 1;
  }

  return count;
}

export async function syncCalendarAccount(
  userId: string,
  account: CalendarAccountRecord,
  oauth2Client: OAuth2Client,
  options?: { daysBack?: number; daysForward?: number }
): Promise<{ syncedCount: number; events: CalendarEvent[] }> {
  const provider = getCalendarProvider(account.provider);
  const daysBack = options?.daysBack ?? 14;
  const daysForward = options?.daysForward ?? 60;

  const timeMin = new Date();
  timeMin.setDate(timeMin.getDate() - daysBack);
  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + daysForward);

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

  return { syncedCount, events };
}
