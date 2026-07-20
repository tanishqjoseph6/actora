import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import type {
  CalendarEvent,
  CalendarEventSource,
  CalendarEventStatus,
  CalendarProviderId,
} from "@/lib/calendar/types";

type MeetingRow = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  meeting_link: string | null;
  attendees: unknown;
  starts_at: string;
  ends_at: string | null;
  status: string;
  provider: string | null;
  external_id: string | null;
  source: string | null;
  contact_email: string | null;
  all_day: boolean | null;
};

function parseAttendees(raw: unknown): CalendarEvent["attendees"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return { email: item };
      if (item && typeof item === "object" && "email" in item) {
        const obj = item as { email?: string; name?: string; responseStatus?: string };
        if (!obj.email) return null;
        return {
          email: obj.email,
          name: obj.name,
          responseStatus: obj.responseStatus,
        };
      }
      return null;
    })
    .filter((a): a is CalendarEvent["attendees"][number] => Boolean(a));
}

export function mapMeetingRowToEvent(row: MeetingRow): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    startAt: row.starts_at,
    endAt: row.ends_at ?? row.starts_at,
    allDay: Boolean(row.all_day),
    attendees: parseAttendees(row.attendees),
    location: row.location ?? undefined,
    meetingLink: row.meeting_link ?? undefined,
    status: (row.status as CalendarEventStatus) ?? "scheduled",
    source: (row.source as CalendarEventSource) ?? "manual",
    provider: (row.provider as CalendarProviderId) ?? null,
    externalId: row.external_id,
    contactEmail: row.contact_email,
    organizer: "You",
  };
}

const SELECT_COLS =
  "id, title, description, location, meeting_link, attendees, starts_at, ends_at, status, provider, external_id, source, contact_email, all_day";

export async function listStoredCalendarEvents(
  userId: string,
  options?: { from?: string; to?: string; contactEmail?: string }
): Promise<CalendarEvent[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];

  const uid = normalizeSubscriptionUserId(userId);
  let query = db
    .from("meetings")
    .select(SELECT_COLS)
    .eq("user_id", uid)
    .order("starts_at", { ascending: true });

  if (options?.from) query = query.gte("starts_at", options.from);
  if (options?.to) query = query.lte("starts_at", options.to);
  if (options?.contactEmail) {
    query = query.ilike("contact_email", options.contactEmail.trim());
  }

  const { data, error } = await query;
  if (error) {
    // Fallback for pre-migration schema
    const legacy = await db
      .from("meetings")
      .select("id, title, starts_at, ends_at, status")
      .eq("user_id", uid)
      .order("starts_at", { ascending: true });

    if (legacy.error) {
      console.error("[calendar/meetings-store]", error);
      return [];
    }

    return (legacy.data ?? []).map((row) =>
      mapMeetingRowToEvent({
        id: row.id,
        title: row.title,
        description: null,
        location: null,
        meeting_link: null,
        attendees: [],
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        status: row.status,
        provider: null,
        external_id: null,
        source: "manual",
        contact_email: null,
        all_day: false,
      })
    );
  }

  return ((data as MeetingRow[] | null) ?? []).map(mapMeetingRowToEvent);
}

export async function listContactMeetings(
  userId: string,
  contactEmail: string
): Promise<{ previous: CalendarEvent[]; upcoming: CalendarEvent[] }> {
  const now = new Date().toISOString();
  const events = await listStoredCalendarEvents(userId, {
    contactEmail,
  });

  // Also match attendees array when contact_email column empty
  const all = await listStoredCalendarEvents(userId);
  const email = contactEmail.trim().toLowerCase();
  const matched = new Map<string, CalendarEvent>();

  for (const event of [...events, ...all]) {
    const hit =
      event.contactEmail?.toLowerCase() === email ||
      event.attendees.some((a) => a.email.toLowerCase() === email);
    if (hit) matched.set(event.id, event);
  }

  const list = Array.from(matched.values()).sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );

  return {
    previous: list.filter((e) => e.endAt < now || e.status === "completed"),
    upcoming: list.filter(
      (e) => e.endAt >= now && e.status !== "cancelled" && e.status !== "completed"
    ),
  };
}
