"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarPlus, CalendarRange, CalendarX2 } from "lucide-react";
import { ScheduleMeetingModal } from "@/components/calendar/ScheduleMeetingModal";

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
  const [cancelling, setCancelling] = useState(false);
  const [note, setNote] = useState<string | null>(null);

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
      setNote("Meeting cancelled.");
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
              setOpen(true);
            }}
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Schedule Meeting
          </ActionChip>
          <ActionChip
            disabled={disabled}
            onClick={() => {
              setMode("reschedule");
              setOpen(true);
            }}
          >
            <CalendarRange className="h-3.5 w-3.5" />
            Reschedule
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
        onClose={() => setOpen(false)}
        initial={{
          title:
            mode === "reschedule"
              ? `Reschedule: ${subject || "Meeting"}`
              : subject
                ? `Meeting: ${subject}`
                : "Meeting",
          attendees: participantEmail ?? "",
          contactEmail: participantEmail,
          description:
            mode === "reschedule"
              ? "Rescheduled from Actora inbox"
              : "Created from Actora inbox",
          addMeetLink: true,
        }}
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
