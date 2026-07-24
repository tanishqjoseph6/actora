"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Video,
} from "lucide-react";
import { PremiumMetricCard } from "@/components/dashboard/premium/PremiumMetricCard";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { CalendarConnectCard } from "@/components/calendar/CalendarConnectCard";
import { MeetingDetailPanel } from "@/components/calendar/MeetingDetailPanel";
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

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am–7pm

export function CalendarWorkspace() {
  const {
    connected,
    account,
    sync,
    syncing,
    refresh: refreshAccount,
  } = useCalendarAccount();
  const [view, setView] = useState<CalendarViewMode>("week");
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasksDue, setTasksDue] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [lastSyncNote, setLastSyncNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = addDays(startOfWeek(anchor), -7).toISOString();
      const to = addDays(startOfWeek(anchor), 45).toISOString();
      const [eventsRes, tasksRes] = await Promise.all([
        fetch(
          `/api/calendar/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        ),
        fetch("/api/tasks").catch(() => null),
      ]);
      const eventsJson = (await eventsRes.json()) as {
        events?: CalendarEvent[];
      };
      setEvents(eventsJson.events ?? []);

      if (tasksRes?.ok) {
        const tasksJson = (await tasksRes.json()) as {
          tasks?: {
            id: string;
            title: string;
            dueDate?: string | null;
            status?: string;
          }[];
        };
        const dueEvents: CalendarEvent[] = (tasksJson.tasks ?? [])
          .filter((t) => t.dueDate && t.status !== "done")
          .map((t) => ({
            id: `task-${t.id}`,
            title: t.title,
            description: "Task due",
            notes: "",
            startAt: t.dueDate!,
            endAt: t.dueDate!,
            allDay: true,
            attendees: [],
            reminderMinutes: 0,
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
      .then((count) => {
        setLastSyncNote(`Synced ${count} events`);
        return load();
      })
      .catch(() => undefined);
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
    const ai = allEvents.filter(
      (e) => e.source === "ai" || e.source === "follow_up"
    );
    const followUps = allEvents.filter(
      (e) => e.source === "follow_up" || e.source === "task"
    );
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
    return anchor.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }, [anchor, view]);

  function shift(delta: number) {
    if (view === "day") setAnchor((d) => addDays(d, delta));
    else if (view === "week") setAnchor((d) => addDays(d, delta * 7));
    else setAnchor((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  async function handleSync() {
    if (connected) {
      try {
        const count = await sync();
        setLastSyncNote(`Synced ${count} events`);
      } catch {
        setLastSyncNote("Sync failed");
      }
    }
    await refreshAccount();
    await load();
  }

  function openEdit(event: CalendarEvent) {
    setSelectedEvent(null);
    setEditingEvent(event);
    setScheduleOpen(true);
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
            Two-way Google sync · Meet links · reminders · notes — keep every
            meeting in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SyncStatusBadge
            connected={connected}
            syncing={syncing}
            lastSyncedAt={account?.lastSyncedAt}
            status={account?.status}
            note={lastSyncNote}
          />
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing}
            className={`${dashboard.btnSecondary} inline-flex items-center gap-1.5 px-3 py-2 text-sm`}
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingEvent(null);
              setScheduleOpen(true);
            }}
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
        <PremiumMetricCard
          title="This week"
          value={metrics.week}
          loading={loading}
          delay={0.04}
        />
        <PremiumMetricCard
          title="AI events"
          value={metrics.ai}
          loading={loading}
          delay={0.08}
        />
        <PremiumMetricCard
          title="Follow-ups & tasks"
          value={metrics.followUps}
          loading={loading}
          delay={0.12}
        />
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
            <p className="ml-1 text-sm font-medium text-white sm:text-base">
              {title}
            </p>
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
            onSelectEvent={setSelectedEvent}
          />
        ) : view === "day" ? (
          <DayHourView
            day={anchor}
            events={allEvents}
            onSelectEvent={setSelectedEvent}
          />
        ) : view === "week" ? (
          <WeekHourView
            anchor={anchor}
            events={allEvents}
            onSelectDay={(d) => {
              setAnchor(d);
              setView("day");
            }}
            onSelectEvent={setSelectedEvent}
          />
        ) : (
          <AgendaView events={allEvents} onSelectEvent={setSelectedEvent} />
        )}
      </div>

      <MeetingDetailPanel
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={openEdit}
        onDeleted={() => void load()}
      />

      <ScheduleMeetingModal
        open={scheduleOpen}
        onClose={() => {
          setScheduleOpen(false);
          setEditingEvent(null);
        }}
        editingEvent={editingEvent}
        onCreated={() => void load()}
        onUpdated={() => void load()}
      />
    </div>
  );
}

function SyncStatusBadge({
  connected,
  syncing,
  lastSyncedAt,
  status,
  note,
}: {
  connected: boolean;
  syncing: boolean;
  lastSyncedAt?: string | null;
  status?: string;
  note?: string | null;
}) {
  if (!connected) {
    return (
      <span className="rounded-md border border-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#71717A]">
        Offline
      </span>
    );
  }

  const label = syncing
    ? "Syncing…"
    : status === "error"
      ? "Sync error"
      : "Live";

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
          syncing
            ? "border-[#3B82F6]/40 bg-[#3B82F6]/15 text-[#93C5FD]"
            : status === "error"
              ? "border-red-500/30 bg-red-500/10 text-red-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
        )}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            syncing
              ? "animate-pulse bg-[#3B82F6]"
              : status === "error"
                ? "bg-red-400"
                : "bg-emerald-400"
          )}
        />
        {label}
      </span>
      <span className="text-[10px] text-[#52525B]">
        {note ||
          (lastSyncedAt
            ? `Last sync ${new Date(lastSyncedAt).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}`
            : "Ready")}
      </span>
    </div>
  );
}

function EventChip({
  event,
  onSelect,
  compact,
}: {
  event: CalendarEvent;
  onSelect?: (e: CalendarEvent) => void;
  compact?: boolean;
}) {
  return (
    <motion.button
      type="button"
      layout
      whileHover={{ y: -1 }}
      onClick={() => onSelect?.(event)}
      className={cn(
        "w-full rounded-xl border border-white/[0.06] bg-[#0A0A0A] text-left transition hover:border-[#3B82F6]/35",
        compact ? "px-2 py-1.5" : "px-3 py-2"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className={cn(
              "truncate font-medium text-white",
              compact ? "text-xs" : "text-sm"
            )}
          >
            {event.title}
          </p>
          <p className={`text-[10px] ${dashboard.subtle}`}>
            {event.allDay ? "All day" : formatEventTime(event.startAt)}
            {event.meetingLink ? " · Meet" : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {event.meetingLink && (
            <Video className="h-3 w-3 text-[#3B82F6]" aria-hidden />
          )}
          {!compact && (
            <span className="rounded-md border border-white/[0.06] px-1.5 py-0.5 text-[10px] text-[#A1A1AA]">
              {sourceLabel(event.source)}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function eventTopPercent(event: CalendarEvent): number {
  const d = new Date(event.startAt);
  const minutes = d.getHours() * 60 + d.getMinutes();
  const start = 7 * 60;
  const end = 20 * 60;
  const clamped = Math.max(start, Math.min(end, minutes));
  return ((clamped - start) / (end - start)) * 100;
}

function eventHeightPercent(event: CalendarEvent): number {
  if (event.allDay) return 8;
  const start = new Date(event.startAt).getTime();
  const end = new Date(event.endAt).getTime();
  const mins = Math.max(30, (end - start) / 60_000);
  const total = (20 - 7) * 60;
  return Math.min(40, (mins / total) * 100);
}

function DayHourView({
  day,
  events,
  onSelectEvent,
}: {
  day: Date;
  events: CalendarEvent[];
  onSelectEvent: (e: CalendarEvent) => void;
}) {
  const dayEvents = eventsForDay(events, day);
  const timed = dayEvents.filter((e) => !e.allDay);
  const allDay = dayEvents.filter((e) => e.allDay);

  return (
    <div>
      {allDay.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {allDay.map((event) => (
            <EventChip
              key={event.id}
              event={event}
              onSelect={onSelectEvent}
              compact
            />
          ))}
        </div>
      )}
      <div className="relative grid grid-cols-[48px_1fr] overflow-hidden rounded-2xl border border-white/[0.06]">
        <div className="border-r border-white/[0.06] bg-[#0A0A0A]">
          {HOURS.map((h) => (
            <div
              key={h}
              className="flex h-14 items-start justify-end pr-2 pt-1 text-[10px] text-[#52525B]"
            >
              {h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`}
            </div>
          ))}
        </div>
        <div className="relative bg-[#0A0A0A]/50">
          {HOURS.map((h) => (
            <div
              key={h}
              className="h-14 border-b border-white/[0.04]"
            />
          ))}
          {timed.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => onSelectEvent(event)}
              className="absolute left-1 right-1 overflow-hidden rounded-lg border border-[#3B82F6]/35 bg-[#3B82F6]/20 px-2 py-1 text-left transition hover:bg-[#3B82F6]/30"
              style={{
                top: `${eventTopPercent(event)}%`,
                height: `${eventHeightPercent(event)}%`,
                minHeight: 28,
              }}
            >
              <p className="truncate text-xs font-medium text-white">
                {event.title}
              </p>
              <p className="text-[10px] text-[#93C5FD]">
                {formatEventTime(event.startAt)}
                {event.meetingLink ? " · Meet" : ""}
              </p>
            </button>
          ))}
          {timed.length === 0 && allDay.length === 0 && (
            <p
              className={`absolute inset-0 flex items-center justify-center text-sm ${dashboard.subtle}`}
            >
              Nothing scheduled for this day.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function WeekHourView({
  anchor,
  events,
  onSelectDay,
  onSelectEvent,
}: {
  anchor: Date;
  events: CalendarEvent[];
  onSelectDay: (d: Date) => void;
  onSelectEvent: (e: CalendarEvent) => void;
}) {
  const start = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[720px] grid-cols-7 gap-2">
        {days.map((day) => {
          const dayEvents = eventsForDay(events, day);
          const isToday = sameDay(day, new Date());
          return (
            <div key={day.toISOString()} className="min-w-0">
              <button
                type="button"
                onClick={() => onSelectDay(day)}
                className={cn(
                  "mb-2 w-full rounded-xl border px-2 py-2 text-left transition",
                  isToday
                    ? "border-[#3B82F6]/40 bg-[#3B82F6]/10"
                    : "border-white/[0.06] bg-[#0A0A0A] hover:border-[#3B82F6]/25"
                )}
              >
                <p className="text-[10px] uppercase tracking-wider text-[#71717A]">
                  {day.toLocaleDateString(undefined, { weekday: "short" })}
                </p>
                <p className="text-sm font-semibold text-white">{day.getDate()}</p>
              </button>
              <div className="min-h-[200px] space-y-1.5 rounded-xl border border-white/[0.06] bg-[#0A0A0A]/40 p-1.5">
                {dayEvents.length === 0 ? (
                  <p className="px-1 py-6 text-center text-[10px] text-[#52525B]">
                    —
                  </p>
                ) : (
                  dayEvents.slice(0, 6).map((event) => (
                    <EventChip
                      key={event.id}
                      event={event}
                      onSelect={onSelectEvent}
                      compact
                    />
                  ))
                )}
                {dayEvents.length > 6 && (
                  <button
                    type="button"
                    onClick={() => onSelectDay(day)}
                    className="w-full text-[10px] text-[#71717A] hover:text-[#93C5FD]"
                  >
                    +{dayEvents.length - 6} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthView({
  anchor,
  events,
  onSelectDay,
  onSelectEvent,
}: {
  anchor: Date;
  events: CalendarEvent[];
  onSelectDay: (d: Date) => void;
  onSelectEvent: (e: CalendarEvent) => void;
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
          const dayEvents = eventsForDay(events, day);
          const isToday = sameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[88px] rounded-xl border p-2 text-left transition",
                inMonth
                  ? "border-white/[0.06] bg-[#0A0A0A]"
                  : "border-transparent bg-transparent opacity-40",
                isToday && "border-[#3B82F6]/45 bg-[#3B82F6]/10"
              )}
            >
              <button
                type="button"
                onClick={() => onSelectDay(startOfDay(day))}
                className="text-xs text-white hover:text-[#93C5FD]"
              >
                {day.getDate()}
              </button>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 2).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className="block w-full truncate rounded-md bg-[#111111] px-1 py-0.5 text-left text-[10px] text-[#CBD5E1] hover:text-white"
                  >
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 2 && (
                  <p className="text-[10px] text-[#71717A]">
                    +{dayEvents.length - 2}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgendaView({
  events,
  onSelectEvent,
}: {
  events: CalendarEvent[];
  onSelectEvent: (e: CalendarEvent) => void;
}) {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
  }, [events]);

  const upcoming = useMemo(() => {
    if (nowMs === null) return [];
    return events
      .filter((e) => new Date(e.endAt).getTime() >= nowMs)
      .sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      )
      .slice(0, 40);
  }, [events, nowMs]);

  if (nowMs === null) {
    return (
      <p className={`py-10 text-center text-sm ${dashboard.subtle}`} aria-busy="true">
        Loading agenda…
      </p>
    );
  }

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
        <EventChip key={event.id} event={event} onSelect={onSelectEvent} />
      ))}
    </div>
  );
}
