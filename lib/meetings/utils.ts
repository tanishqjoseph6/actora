import type { Meeting } from "./types";

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getWeekDays(anchor = new Date()): Date[] {
  const d = startOfDay(anchor);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day;
  });
}

export function getMeetingsForDay(meetings: Meeting[], day: Date): Meeting[] {
  return meetings
    .filter((m) => isSameDay(new Date(m.startAt), day))
    .sort(
      (a, b) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
}

export function getUpcomingMeetings(
  meetings: Meeting[],
  from = new Date()
): Meeting[] {
  const now = from.getTime();
  return meetings
    .filter(
      (m) =>
        m.status !== "cancelled" && new Date(m.startAt).getTime() >= now
    )
    .sort(
      (a, b) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
}

export function formatMeetingTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatMeetingDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatMeetingDuration(startIso: string, endIso: string): string {
  const mins = Math.round(
    (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000
  );
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getRelativeDayLabel(date: Date, today = new Date()): string {
  const t = startOfDay(today);
  const d = startOfDay(date);
  const diff = Math.round((d.getTime() - t.getTime()) / 86_400_000);

  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff <= 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function groupMeetingsByDay(
  meetings: Meeting[]
): { label: string; date: Date; meetings: Meeting[] }[] {
  const groups = new Map<string, { label: string; date: Date; meetings: Meeting[] }>();

  for (const meeting of meetings) {
    const date = startOfDay(new Date(meeting.startAt));
    const key = date.toISOString();
    const label = getRelativeDayLabel(date);

    if (!groups.has(key)) {
      groups.set(key, { label, date, meetings: [] });
    }
    groups.get(key)!.meetings.push(meeting);
  }

  return Array.from(groups.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
}

export function computeMeetingMetrics(meetings: Meeting[]) {
  const now = new Date();
  const weekDays = getWeekDays(now);
  const weekStart = weekDays[0];
  const weekEnd = new Date(weekDays[6]);
  weekEnd.setHours(23, 59, 59, 999);

  const thisWeek = meetings.filter((m) => {
    const t = new Date(m.startAt).getTime();
    return t >= weekStart.getTime() && t <= weekEnd.getTime() && m.status !== "cancelled";
  });

  const today = getMeetingsForDay(meetings, now).filter(
    (m) => m.status !== "cancelled"
  );

  const totalMinutes = thisWeek.reduce((sum, m) => {
    return (
      sum +
      (new Date(m.endAt).getTime() - new Date(m.startAt).getTime()) / 60_000
    );
  }, 0);

  const videoCalls = thisWeek.filter((m) => m.type === "video").length;

  return {
    thisWeek: thisWeek.length,
    today: today.length,
    hoursScheduled: Math.round((totalMinutes / 60) * 10) / 10,
    videoCalls,
  };
}
