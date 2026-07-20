"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarPlus, CalendarRange, CalendarX2 } from "lucide-react";
import { ScheduleMeetingModal } from "@/components/calendar/ScheduleMeetingModal";
import type { CalendarEvent } from "@/lib/calendar/types";

type EmailSchedulingActionsProps = {
  subject?: string;
  participantEmail?: string;
  disabled?: boolean;
};

export function EmailSchedulingActions({
  subject,
  participantEmail,
  disabled,
}: EmailSchedulingActionsProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "reschedule">("create");
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [loadingReschedule, setLoadingReschedule] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function openReschedule() {
    if (!participantEmail) {
      setNote("No participant email found on this thread.");
      return;
    }
    setLoadingReschedule(true);
    setNote(null);
    try {
      const res = await fetch(
        `/api/calendar/contact-meetings?email=${encodeURIComponent(participantEmail)}`
      );
      const json = (await res.json()) as {
        upcoming?: CalendarEvent[];
      };
      const next = json.upcoming?.[0];
      if (!next) {
        setMode("create");
        setEditingEvent(null);
        setOpen(true);
        setNote("No upcoming meeting found — creating a new one.");
        return;
      }
      setMode("reschedule");
      setEditingEvent(next);
      setOpen(true);
    } catch {
      setNote("Could not load meetings for this contact.");
    } finally {
      setLoadingReschedule(false);
    }
  }

  async function cancelRelatedMeeting() {
    if (!participantEmail) {
      setNote("No participant email found on this thread.");
      return;
    }
    setCancelling(true);
    setNote(null);
    try {
      const res = await fetch(
        `/api/calendar/contact-meetings?email=${encodeURIComponent(participantEmail)}`
      );
      const json = (await res.json()) as {
        upcoming?: { id: string; title: string }[];
      };
      const next = json.upcoming?.[0];
      if (!next) {
        setNote("No upcoming meeting found for this contact.");
        return;
      }
      const confirmed = window.confirm(`Cancel “${next.title}”?`);
      if (!confirmed) return;
      await fetch(`/api/calendar/events/${next.id}`, { method: "DELETE" });
      setNote("Meeting cancelled and removed from Google Calendar.");
    } catch {
      setNote("Could not cancel meeting.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <>
      <div className="mt-4 rounded-2xl border border-white/[0.06] bg-[#111111]/60 p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#71717A]">
          Calendar
        </p>
        <div className="flex flex-wrap gap-2">
          <ActionChip
            disabled={disabled}
            onClick={() => {
              setMode("create");
              setEditingEvent(null);
              setOpen(true);
            }}
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Schedule Meeting
          </ActionChip>
          <ActionChip
            disabled={disabled || loadingReschedule}
            onClick={() => void openReschedule()}
          >
            <CalendarRange className="h-3.5 w-3.5" />
            {loadingReschedule ? "Loading…" : "Reschedule"}
          </ActionChip>
          <ActionChip
            disabled={disabled || cancelling}
            onClick={() => void cancelRelatedMeeting()}
          >
            <CalendarX2 className="h-3.5 w-3.5" />
            {cancelling ? "Cancelling…" : "Cancel Meeting"}
          </ActionChip>
          <Link
            href="/dashboard/calendar"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] px-3 py-1.5 text-xs text-[#A1A1AA] transition hover:border-[#3B82F6]/35 hover:text-white"
          >
            View Calendar
          </Link>
        </div>
        {note && <p className="mt-2 text-xs text-[#93C5FD]">{note}</p>}
      </div>

      <ScheduleMeetingModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingEvent(null);
        }}
        editingEvent={editingEvent}
        initial={
          mode === "create" || !editingEvent
            ? {
                title: subject ? `Meeting: ${subject}` : "Meeting",
                attendees: participantEmail ?? "",
                contactEmail: participantEmail,
                description: "Created from Actora inbox",
                notes: "",
                addMeetLink: true,
                reminderMinutes: 30,
              }
            : undefined
        }
        onCreated={() => setNote("Meeting created and synced.")}
        onUpdated={() => setNote("Meeting rescheduled and synced.")}
      />
    </>
  );
}

function ActionChip({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] px-3 py-1.5 text-xs text-[#A1A1AA] transition hover:border-[#3B82F6]/35 hover:text-white disabled:opacity-50"
    >
      {children}
    </button>
  );
}
