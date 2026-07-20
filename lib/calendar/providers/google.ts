import { google } from "googleapis";
import type { calendar_v3 } from "googleapis";
import type { CalendarProviderAdapter } from "@/lib/calendar/providers/types";
import type {
  CalendarEvent,
  CreateCalendarEventInput,
  FreeBusySlot,
  SuggestedTimeSlot,
  SuggestTimesInput,
  UpdateCalendarEventInput,
} from "@/lib/calendar/types";

function mapGoogleEvent(event: calendar_v3.Schema$Event): CalendarEvent {
  const startAt =
    event.start?.dateTime ??
    (event.start?.date ? `${event.start.date}T00:00:00.000Z` : new Date().toISOString());
  const endAt =
    event.end?.dateTime ??
    (event.end?.date ? `${event.end.date}T23:59:59.000Z` : startAt);

  const meetLink =
    event.hangoutLink ??
    event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")
      ?.uri ??
    undefined;

  const status =
    event.status === "cancelled"
      ? "cancelled"
      : new Date(endAt).getTime() < Date.now()
        ? "completed"
        : "scheduled";

  return {
    id: event.id ?? crypto.randomUUID(),
    title: event.summary?.trim() || "(No title)",
    description: event.description ?? "",
    startAt,
    endAt,
    allDay: Boolean(event.start?.date && !event.start?.dateTime),
    attendees: (event.attendees ?? [])
      .filter((a) => a.email)
      .map((a) => ({
        email: a.email!,
        name: a.displayName ?? undefined,
        responseStatus: a.responseStatus ?? undefined,
      })),
    location: event.location ?? undefined,
    meetingLink: meetLink,
    status,
    source: "google",
    provider: "google",
    externalId: event.id ?? null,
    contactEmail: event.attendees?.find((a) => a.email && !a.self)?.email ?? null,
    organizer: event.organizer?.email ?? undefined,
  };
}

function toGoogleDate(iso: string, allDay = false) {
  if (allDay) {
    return { date: iso.slice(0, 10) };
  }
  return { dateTime: iso, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
}

async function listEvents(
  auth: Parameters<CalendarProviderAdapter["listEvents"]>[0],
  params: Parameters<CalendarProviderAdapter["listEvents"]>[1]
): Promise<CalendarEvent[]> {
  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: params.timeMin,
    timeMax: params.timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: params.maxResults ?? 250,
  });

  return (res.data.items ?? []).map(mapGoogleEvent);
}

async function createEvent(
  auth: Parameters<CalendarProviderAdapter["createEvent"]>[0],
  input: CreateCalendarEventInput
): Promise<CalendarEvent> {
  const calendar = google.calendar({ version: "v3", auth });
  const timeZone =
    input.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const body: calendar_v3.Schema$Event = {
    summary: input.title,
    description: input.description,
    location: input.location,
    start: { dateTime: input.startAt, timeZone },
    end: { dateTime: input.endAt, timeZone },
    attendees: (input.attendees ?? []).map((email) => ({ email })),
  };

  if (input.addMeetLink) {
    body.conferenceData = {
      createRequest: {
        requestId: `actora-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: body,
    conferenceDataVersion: input.addMeetLink ? 1 : 0,
    sendUpdates: "all",
  });

  return mapGoogleEvent(res.data);
}

async function updateEvent(
  auth: Parameters<CalendarProviderAdapter["updateEvent"]>[0],
  externalId: string,
  input: UpdateCalendarEventInput
): Promise<CalendarEvent> {
  const calendar = google.calendar({ version: "v3", auth });
  const timeZone =
    input.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const patch: calendar_v3.Schema$Event = {};
  if (input.title !== undefined) patch.summary = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.location !== undefined) patch.location = input.location;
  if (input.startAt !== undefined) {
    patch.start = { dateTime: input.startAt, timeZone };
  }
  if (input.endAt !== undefined) {
    patch.end = { dateTime: input.endAt, timeZone };
  }
  if (input.attendees !== undefined) {
    patch.attendees = input.attendees.map((email) => ({ email }));
  }
  if (input.status === "cancelled") {
    patch.status = "cancelled";
  }

  if (input.addMeetLink) {
    patch.conferenceData = {
      createRequest: {
        requestId: `actora-meet-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const res = await calendar.events.patch({
    calendarId: "primary",
    eventId: externalId,
    requestBody: patch,
    conferenceDataVersion: input.addMeetLink ? 1 : 0,
    sendUpdates: "all",
  });

  return mapGoogleEvent(res.data);
}

async function deleteEvent(
  auth: Parameters<CalendarProviderAdapter["deleteEvent"]>[0],
  externalId: string
): Promise<void> {
  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({
    calendarId: "primary",
    eventId: externalId,
    sendUpdates: "all",
  });
}

async function getFreeBusy(
  auth: Parameters<CalendarProviderAdapter["getFreeBusy"]>[0],
  params: { timeMin: string; timeMax: string; calendars?: string[] }
): Promise<FreeBusySlot[]> {
  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: params.timeMin,
      timeMax: params.timeMax,
      items: (params.calendars ?? ["primary"]).map((id) => ({ id })),
    },
  });

  const busy = res.data.calendars?.primary?.busy ?? [];
  return busy
    .filter((slot) => slot.start && slot.end)
    .map((slot) => ({ start: slot.start!, end: slot.end! }));
}

function overlaps(
  start: number,
  end: number,
  busy: FreeBusySlot[]
): boolean {
  return busy.some((slot) => {
    const bStart = new Date(slot.start).getTime();
    const bEnd = new Date(slot.end).getTime();
    return start < bEnd && end > bStart;
  });
}

async function suggestTimes(
  auth: Parameters<CalendarProviderAdapter["suggestTimes"]>[0],
  input: SuggestTimesInput
): Promise<SuggestedTimeSlot[]> {
  const durationMinutes = input.durationMinutes ?? 30;
  const daysAhead = input.daysAhead ?? 5;
  const workStart = input.workingHoursStart ?? 9;
  const workEnd = input.workingHoursEnd ?? 17;

  const timeMin = new Date();
  timeMin.setMinutes(0, 0, 0);
  if (timeMin.getHours() >= workEnd) {
    timeMin.setDate(timeMin.getDate() + 1);
    timeMin.setHours(workStart, 0, 0, 0);
  } else if (timeMin.getHours() < workStart) {
    timeMin.setHours(workStart, 0, 0, 0);
  } else {
    timeMin.setHours(timeMin.getHours() + 1, 0, 0, 0);
  }

  const timeMax = new Date(timeMin);
  timeMax.setDate(timeMax.getDate() + daysAhead);
  timeMax.setHours(workEnd, 0, 0, 0);

  const busy = await getFreeBusy(auth, {
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
  });

  const suggestions: SuggestedTimeSlot[] = [];
  const cursor = new Date(timeMin);

  while (suggestions.length < 5 && cursor < timeMax) {
    const hour = cursor.getHours();
    const day = cursor.getDay();
    if (day === 0 || day === 6 || hour < workStart || hour >= workEnd) {
      if (hour >= workEnd || day === 0 || day === 6) {
        cursor.setDate(cursor.getDate() + (day === 6 ? 2 : day === 0 ? 1 : 1));
        cursor.setHours(workStart, 0, 0, 0);
      } else {
        cursor.setHours(workStart, 0, 0, 0);
      }
      continue;
    }

    const startMs = cursor.getTime();
    const endMs = startMs + durationMinutes * 60_000;
    if (!overlaps(startMs, endMs, busy)) {
      const startAt = new Date(startMs).toISOString();
      const endAt = new Date(endMs).toISOString();
      suggestions.push({
        startAt,
        endAt,
        label: new Date(startMs).toLocaleString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      });
    }

    cursor.setMinutes(cursor.getMinutes() + 30);
  }

  return suggestions;
}

export const googleCalendarProvider: CalendarProviderAdapter = {
  id: "google",
  label: "Google Calendar",
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getFreeBusy,
  suggestTimes,
};

// Silence unused helper warning in some bundlers
void toGoogleDate;
