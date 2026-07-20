import type { google } from "googleapis";
import type {
  CalendarEvent,
  CalendarProviderId,
  CreateCalendarEventInput,
  FreeBusySlot,
  SuggestedTimeSlot,
  SuggestTimesInput,
  UpdateCalendarEventInput,
} from "@/lib/calendar/types";

export type CalendarAuthClient = InstanceType<typeof google.auth.OAuth2>;

export type ListEventsParams = {
  timeMin: string;
  timeMax: string;
  maxResults?: number;
};

export type CalendarProviderAdapter = {
  id: CalendarProviderId;
  label: string;
  /** List remote events in a window. */
  listEvents: (
    auth: CalendarAuthClient,
    params: ListEventsParams
  ) => Promise<CalendarEvent[]>;
  createEvent: (
    auth: CalendarAuthClient,
    input: CreateCalendarEventInput
  ) => Promise<CalendarEvent>;
  updateEvent: (
    auth: CalendarAuthClient,
    externalId: string,
    input: UpdateCalendarEventInput
  ) => Promise<CalendarEvent>;
  deleteEvent: (
    auth: CalendarAuthClient,
    externalId: string
  ) => Promise<void>;
  getFreeBusy: (
    auth: CalendarAuthClient,
    params: { timeMin: string; timeMax: string; calendars?: string[] }
  ) => Promise<FreeBusySlot[]>;
  suggestTimes: (
    auth: CalendarAuthClient,
    input: SuggestTimesInput
  ) => Promise<SuggestedTimeSlot[]>;
};
