"use client";

import { useState } from "react";
import {
  Bell,
  ExternalLink,
  MapPin,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import { DrawerShell } from "@/components/ui/DrawerShell";
import { ProductionAlert } from "@/components/ui/ProductionAlert";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { friendlyErrorMessage } from "@/lib/errors/friendly";
import type { CalendarEvent } from "@/lib/calendar/types";
import { formatEventTime, sourceLabel } from "@/lib/calendar/view-utils";

type MeetingDetailPanelProps = {
  event: CalendarEvent | null;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDeleted: () => void;
};

export function MeetingDetailPanel({
  event,
  onClose,
  onEdit,
  onDeleted,
}: MeetingDetailPanelProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!event || event.id.startsWith("task-")) return;
    const confirmed = window.confirm(`Delete “${event.title}”?`);
    if (!confirmed) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/calendar/events/${event.id}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Delete failed");
      onDeleted();
      onClose();
    } catch (err) {
      setError(friendlyErrorMessage(err, "server"));
    } finally {
      setDeleting(false);
    }
  }

  const isTask = event?.id.startsWith("task-");

  return (
    <DrawerShell
      open={Boolean(event)}
      onClose={onClose}
      titleId="meeting-detail-title"
      className="flex flex-col"
    >
      {event && (
        <>
            <header className="flex items-start justify-between gap-4 border-b border-white/[0.06] p-5 sm:p-6">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-[#71717A]">
                  {sourceLabel(event.source)}
                </p>
                <h2
                  id="meeting-detail-title"
                  className="mt-1 text-lg font-bold leading-snug text-white"
                >
                  {event.title}
                </h2>
                <p className={`mt-1 text-sm ${dashboard.muted}`}>
                  {event.allDay
                    ? "All day"
                    : `${formatEventTime(event.startAt)} – ${formatEventTime(event.endAt)}`}
                </p>
                <p className={`text-xs ${dashboard.subtle}`}>
                  {new Date(event.startAt).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-xl border border-white/[0.06] p-2 text-[#71717A] transition-colors hover:border-[#3B82F6]/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/40"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="premium-scrollbar flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
              {event.meetingLink && (
                <a
                  href={event.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-4 py-3 text-sm font-medium text-[#93C5FD] transition hover:bg-[#3B82F6]/20"
                >
                  <Video className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">Join Google Meet</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              )}

              {event.location && (
                <InfoRow
                  icon={<MapPin className="h-3.5 w-3.5" />}
                  label="Location"
                  value={event.location}
                />
              )}

              <InfoRow
                icon={<Bell className="h-3.5 w-3.5" />}
                label="Reminder"
                value={
                  event.reminderMinutes > 0
                    ? `${event.reminderMinutes} min before`
                    : "None"
                }
              />

              {event.attendees.length > 0 && (
                <section>
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#71717A]">
                    <Users className="h-3.5 w-3.5" />
                    Attendees
                  </div>
                  <ul className="space-y-1.5">
                    {event.attendees.map((a) => (
                      <li
                        key={a.email}
                        className="rounded-xl border border-white/[0.06] bg-[#111111] px-3 py-2 text-sm text-[#A1A1AA]"
                      >
                        <span className="text-white">{a.name || a.email}</span>
                        {a.name && (
                          <span className="mt-0.5 block text-xs text-[#71717A]">
                            {a.email}
                          </span>
                        )}
                        {a.responseStatus && (
                          <span className="mt-1 inline-block text-[10px] uppercase tracking-wide text-[#71717A]">
                            {a.responseStatus}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {(event.description || event.notes) && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#71717A]">
                    {event.notes ? "Notes" : "Agenda"}
                  </h3>
                  <p className="whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-[#111111] p-3 text-sm text-[#A1A1AA]">
                    {event.notes || event.description}
                  </p>
                  {event.notes && event.description && (
                    <>
                      <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-[#71717A]">
                        Description
                      </h3>
                      <p className="whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-[#111111] p-3 text-sm text-[#A1A1AA]">
                        {event.description}
                      </p>
                    </>
                  )}
                </section>
              )}

              {error && (
                <ProductionAlert
                  variant="error"
                  title="Could not delete meeting"
                  message={error}
                  onDismiss={() => setError(null)}
                />
              )}
            </div>

            {!isTask && (
              <footer className="flex flex-col gap-2 border-t border-white/[0.06] p-5 sm:flex-row sm:p-6">
                <button
                  type="button"
                  onClick={() => onEdit(event)}
                  className={`${dashboard.btnPrimary} flex-1 py-2.5 text-sm`}
                >
                  Edit meeting
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleting}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-500/30 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </footer>
            )}
        </>
      )}
    </DrawerShell>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-[#111111] px-3 py-2.5">
      <span className="mt-0.5 text-[#71717A]">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-[#71717A]">
          {label}
        </p>
        <p className="truncate text-sm text-white">{value}</p>
      </div>
    </div>
  );
}
