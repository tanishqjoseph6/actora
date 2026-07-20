"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
} from "lucide-react";
import { PremiumMetricCard } from "@/components/dashboard/premium/PremiumMetricCard";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { CalendarConnectCard } from "@/components/calendar/CalendarConnectCard";
import { ScheduleMeetingModal } from "@/components/calendar/ScheduleMeetingModal";
import { useCalendarAccount } from "@/hooks/useCalendarAccount";
import type { CalendarEvent } from "@/lib/calendar/types";
import {
  addDays,
  endOfDay,
  eventsForDay,
  eventsInRange,
  formatEventTime,
  monthMatrix,
  sameDay,
  sourceLabel,
  startOfDay,
  startOfWeek,
  type CalendarViewMode,
} from "@/lib/calendar/view-utils";
import { cn } from "@/lib/utils";

const VIEWS: { id: CalendarViewMode; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "agenda", label: "Agenda" },
];

export function CalendarWorkspace() {
  const { connected, sync, syncing, refresh: refreshAccount } =
    useCalendarAccount();
  const [view, setView] = useState<CalendarViewMode>("week");
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasksDue, setTasksDue] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = addDays(startOfWeek(anchor), -7).toISOString();
      const to = addDays(startOfWeek(anchor), 45).toISOString();
      const [eventsRes, tasksRes] = await Promise.all([
        fetch(`/api/calendar/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
        fetch("/api/tasks").catch(() => null),
      ]);
      const eventsJson = (await eventsRes.json()) as { events?: CalendarEvent[] };
      setEvents(eventsJson.events ?? []);

      if (tasksRes?.ok) {
        const tasksJson = (await tasksRes.json()) as {
          tasks?: { id: string; title: string; dueDate?: string | null; status?: string }[];
        };
        const dueEvents: CalendarEvent[] = (tasksJson.tasks ?? [])
          .filter((t) => t.dueDate && t.status !== "done")
          .map((t) => ({
            id: `task-${t.id}`,
            title: t.title,
            description: "Task due",
            startAt: t.dueDate!,
            endAt: t.dueDate!,
            allDay: true,
            attendees: [],
            status: "scheduled" as const,
            source: "task" as const,
          }));
        setTasksDue(dueEvents);
      } else {
        setTasksDue([]);
      }
    } finally {
      setLoading(false);
    }
  }, [anchor]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!connected) return;
    void sync()
      .then(() => load())
      .catch(() => undefined);
    // Auto-sync once when calendar is connected
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  const allEvents = useMemo(
    () => [...events, ...tasksDue],
    [events, tasksDue]
  );

  const metrics = useMemo(() => {
    const today = eventsForDay(allEvents, new Date());
    const week = eventsInRange(
      allEvents,
      startOfWeek(new Date()),
      endOfDay(addDays(startOfWeek(new Date()), 6))
    );
    const ai = allEvents.filter((e) => e.source === "ai" || e.source === "follow_up");
    const followUps = allEvents.filter((e) => e.source === "follow_up" || e.source === "task");
    return {
      today: today.length,
      week: week.length,
      ai: ai.length,
      followUps: followUps.length,
    };
  }, [allEvents]);

  const title = useMemo(() => {
    if (view === "day") {
      return anchor.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    }
    if (view === "week") {
      const start = startOfWeek(anchor);
      const end = addDays(start, 6);
      return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }, [anchor, view]);

  function shift(delta: number) {
    if (view === "day") setAnchor((d) => addDays(d, delta));
    else if (view === "week") setAnchor((d) => addDays(d, delta * 7));
    else setAnchor((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  async function handleSync() {
    if (connected) await sync();
    await refreshAccount();
    await load();
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#3B82F6]">
            Calendar
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Your schedule
          </h1>
          <p className={`mt-2 max-w-xl text-sm ${dashboard.muted}`}>
            Meetings, AI-created events, follow-ups, and tasks — synced with Google Calendar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing}
            className={`${dashboard.btnSecondary} inline-flex items-center gap-1.5 px-3 py-2 text-sm`}
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            Sync
          </button>
          <button
            type="button"
            onClick={() => setScheduleOpen(true)}
            className={`${dashboard.btnPrimary} inline-flex items-center gap-1.5 px-3 py-2 text-sm`}
          >
            <Plus className="h-4 w-4" />
            Schedule
          </button>
        </div>
      </div>

      <div className="mb-6">
        <CalendarConnectCard />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <PremiumMetricCard title="Today" value={metrics.today} loading={loading} />
        <PremiumMetricCard title="This week" value={metrics.week} loading={loading} delay={0.04} />
        <PremiumMetricCard title="AI events" value={metrics.ai} loading={loading} delay={0.08} />
        <PremiumMetricCard title="Follow-ups & tasks" value={metrics.followUps} loading={loading} delay={0.12} />
      </div>

      <div className={`${dashboard.cardLg} p-4 sm:p-5`}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => shift(-1)}
              className="rounded-xl border border-white/[0.08] p-2 text-[#A1A1AA] hover:text-white"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setAnchor(startOfDay(new Date()))}
              className={`${dashboard.btnSecondary} px-3 py-2 text-xs`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => shift(1)}
              className="rounded-xl border border-white/[0.08] p-2 text-[#A1A1AA] hover:text-white"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <p className="ml-1 text-sm font-medium text-white sm:text-base">{title}</p>
          </div>
          <div className="flex rounded-xl border border-white/[0.06] bg-[#0A0A0A] p-1">
            {VIEWS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                  view === item.id
                    ? "bg-[#3B82F6]/20 text-white"
                    : "text-[#71717A] hover:text-white"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 py-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-2xl bg-white/[0.04]"
              />
            ))}
          </div>
        ) : view === "month" ? (
          <MonthView
            anchor={anchor}
            events={allEvents}
            onSelectDay={(d) => {
              setAnchor(d);
              setView("day");
            }}
          />
        ) : view === "day" ? (
          <DayView day={anchor} events={allEvents} />
        ) : view === "week" ? (
          <WeekView
            anchor={anchor}
            events={allEvents}
            onSelectDay={(d) => {
              setAnchor(d);
              setView("day");
            }}
          />
        ) : (
          <AgendaView events={allEvents} />
        )}
      </div>

      <ScheduleMeetingModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onCreated={() => void load()}
      />
    </div>
  );
}

function EventChip({ event }: { event: CalendarEvent }) {
  return (
    <motion.div
      layout
      whileHover={{ y: -1 }}
      className="rounded-xl border border-white/[0.06] bg-[#0A0A0A] px-3 py-2 transition hover:border-[#3B82F6]/35"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{event.title}</p>
          <p className={`text-xs ${dashboard.subtle}`}>
            {event.allDay ? "All day" : formatEventTime(event.startAt)}
            {event.meetingLink ? " · Meet" : ""}
          </p>
        </div>
        <span className="shrink-0 rounded-md border border-white/[0.06] px-1.5 py-0.5 text-[10px] text-[#A1A1AA]">
          {sourceLabel(event.source)}
        </span>
      </div>
    </motion.div>
  );
}

function DayView({ day, events }: { day: Date; events: CalendarEvent[] }) {
  const dayEvents = eventsForDay(events, day);
  if (!dayEvents.length) {
    return (
      <p className={`py-10 text-center text-sm ${dashboard.subtle}`}>
        Nothing scheduled for this day.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {dayEvents.map((event) => (
        <EventChip key={event.id} event={event} />
      ))}
    </div>
  );
}

function WeekView({
  anchor,
  events,
  onSelectDay,
}: {
  anchor: Date;
  events: CalendarEvent[];
  onSelectDay: (d: Date) => void;
}) {
  const start = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
      {days.map((day) => {
        const dayEvents = eventsForDay(events, day);
        const isToday = sameDay(day, new Date());
        return (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => onSelectDay(day)}
            className={cn(
              "min-h-[140px] rounded-2xl border p-3 text-left transition hover:-translate-y-0.5",
              isToday
                ? "border-[#3B82F6]/40 bg-[#3B82F6]/10"
                : "border-white/[0.06] bg-[#0A0A0A] hover:border-[#3B82F6]/25"
            )}
          >
            <p className="text-[10px] uppercase tracking-wider text-[#71717A]">
              {day.toLocaleDateString(undefined, { weekday: "short" })}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white">{day.getDate()}</p>
            <div className="mt-2 space-y-1.5">
              {dayEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="truncate rounded-lg bg-[#111111] px-1.5 py-1 text-[10px] text-[#CBD5E1]"
                >
                  {event.allDay ? "" : `${formatEventTime(event.startAt)} `}
                  {event.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <p className="text-[10px] text-[#71717A]">
                  +{dayEvents.length - 3} more
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MonthView({
  anchor,
  events,
  onSelectDay,
}: {
  anchor: Date;
  events: CalendarEvent[];
  onSelectDay: (d: Date) => void;
}) {
  const weeks = monthMatrix(anchor);
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[640px] grid-cols-7 gap-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <p
            key={d}
            className="px-1 text-[10px] font-medium uppercase tracking-wider text-[#52525B]"
          >
            {d}
          </p>
        ))}
        {weeks.flat().map((day) => {
          const inMonth = day.getMonth() === anchor.getMonth();
          const count = eventsForDay(events, day).length;
          const isToday = sameDay(day, new Date());
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay(startOfDay(day))}
              className={cn(
                "min-h-[72px] rounded-xl border p-2 text-left transition hover:border-[#3B82F6]/35",
                inMonth
                  ? "border-white/[0.06] bg-[#0A0A0A]"
                  : "border-transparent bg-transparent opacity-40",
                isToday && "border-[#3B82F6]/45 bg-[#3B82F6]/10"
              )}
            >
              <p className="text-xs text-white">{day.getDate()}</p>
              {count > 0 && (
                <p className="mt-2 text-[10px] text-[#93C5FD]">
                  {count} event{count === 1 ? "" : "s"}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AgendaView({ events }: { events: CalendarEvent[] }) {
  const upcoming = events
    .filter((e) => new Date(e.endAt).getTime() >= Date.now())
    .sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    )
    .slice(0, 40);

  if (!upcoming.length) {
    return (
      <p className={`py-10 text-center text-sm ${dashboard.subtle}`}>
        No upcoming meetings. Schedule one or sync Google Calendar.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {upcoming.map((event) => (
        <EventChip key={event.id} event={event} />
      ))}
    </div>
  );
}
