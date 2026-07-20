import { googleCalendarProvider } from "@/lib/calendar/providers/google";
import type { CalendarProviderAdapter } from "@/lib/calendar/providers/types";
import type { CalendarProviderId } from "@/lib/calendar/types";

const PROVIDERS: Record<CalendarProviderId, CalendarProviderAdapter | null> = {
  google: googleCalendarProvider,
  outlook: null,
  apple: null,
  zoom: null,
};

export function getCalendarProvider(
  id: CalendarProviderId = "google"
): CalendarProviderAdapter {
  const provider = PROVIDERS[id];
  if (!provider) {
    throw new Error(
      `${id} calendar is not available yet. Google Calendar is supported today.`
    );
  }
  return provider;
}

export function listAvailableCalendarProviders(): CalendarProviderAdapter[] {
  return Object.values(PROVIDERS).filter(
    (p): p is CalendarProviderAdapter => p != null
  );
}
