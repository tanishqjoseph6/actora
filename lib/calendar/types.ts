/** Multi-provider calendar types (Google first; Outlook/Apple/Zoom-ready). */

export type CalendarProviderId = "google" | "outlook" | "apple" | "zoom";

export type CalendarAccountStatus = "connected" | "error" | "disconnected";

export type CalendarEventSource =
  | "manual"
  | "google"
  | "ai"
  | "task"
  | "follow_up"
  | "outlook"
  | "apple";

export type CalendarEventStatus = "scheduled" | "completed" | "cancelled";

export type CalendarAccountRecord = {
  id: string;
  userId: string;
  provider: CalendarProviderId;
  accountEmail: string;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: string | null;
  scopes: string[];
  connectedAt: string;
  lastSyncedAt: string | null;
  lastSyncCount: number;
  status: CalendarAccountStatus;
  metadata: Record<string, unknown>;
};

export type CalendarAccountPublic = {
  id: string;
  provider: CalendarProviderId;
  accountEmail: string;
  connectedAt: string;
  lastSyncedAt: string | null;
  lastSyncCount: number;
  status: CalendarAccountStatus;
};

export type CalendarAttendee = {
  email: string;
  name?: string;
  responseStatus?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  notes: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  attendees: CalendarAttendee[];
  location?: string;
  meetingLink?: string;
  reminderMinutes: number;
  reminderSentAt?: string | null;
  status: CalendarEventStatus;
  source: CalendarEventSource;
  provider?: CalendarProviderId | null;
  externalId?: string | null;
  contactEmail?: string | null;
  organizer?: string;
};

export type CreateCalendarEventInput = {
  title: string;
  description?: string;
  notes?: string;
  startAt: string;
  endAt: string;
  attendees?: string[];
  location?: string;
  addMeetLink?: boolean;
  reminderMinutes?: number;
  contactEmail?: string;
  source?: CalendarEventSource;
  timeZone?: string;
};

export type UpdateCalendarEventInput = Partial<CreateCalendarEventInput> & {
  status?: CalendarEventStatus;
};

export type FreeBusySlot = {
  start: string;
  end: string;
};

export type SuggestTimesInput = {
  durationMinutes?: number;
  daysAhead?: number;
  workingHoursStart?: number;
  workingHoursEnd?: number;
  attendeeEmails?: string[];
  timeZone?: string;
};

export type SuggestedTimeSlot = {
  startAt: string;
  endAt: string;
  label: string;
};
