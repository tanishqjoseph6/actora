import type { CalendarEvent } from "@/lib/calendar/types";

export type CalendarViewMode = "day" | "week" | "month" | "agenda";

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday-start
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function eventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  const start = startOfDay(day).getTime();
  const end = endOfDay(day).getTime();
  return events.filter((event) => {
    const s = new Date(event.startAt).getTime();
    return s >= start && s <= end && event.status !== "cancelled";
  });
}

export function eventsInRange(
  events: CalendarEvent[],
  from: Date,
  to: Date
): CalendarEvent[] {
  const start = from.getTime();
  const end = to.getTime();
  return events.filter((event) => {
    const s = new Date(event.startAt).getTime();
    return s >= start && s <= end && event.status !== "cancelled";
  });
}

export function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function sourceLabel(source: CalendarEvent["source"]): string {
  switch (source) {
    case "google":
      return "Google";
    case "ai":
      return "AI";
    case "task":
      return "Task";
    case "follow_up":
      return "Follow-up";
    default:
      return "Manual";
  }
}

export function monthMatrix(anchor: Date): Date[][] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = startOfWeek(first);
  const weeks: Date[][] = [];
  let cursor = start;
  for (let w = 0; w < 6; w += 1) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d += 1) {
      week.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}
