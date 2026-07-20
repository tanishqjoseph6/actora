"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, Link2, Sparkles, X } from "lucide-react";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import type { SuggestedTimeSlot } from "@/lib/calendar/types";

export type ScheduleMeetingDraft = {
  title: string;
  startAt: string;
  endAt: string;
  attendees: string;
  description?: string;
  addMeetLink: boolean;
  contactEmail?: string;
};

type ScheduleMeetingModalProps = {
  open: boolean;
  onClose: () => void;
  initial?: Partial<ScheduleMeetingDraft>;
  onCreated?: () => void;
};

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ScheduleMeetingModal({
  open,
  onClose,
  initial,
  onCreated,
}: ScheduleMeetingModalProps) {
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedTimeSlot[]>([]);
  const [availabilityNote, setAvailabilityNote] = useState<string | null>(null);
  const [draft, setDraft] = useState<ScheduleMeetingDraft>({
    title: "",
    startAt: "",
    endAt: "",
    attendees: "",
    description: "",
    addMeetLink: true,
  });

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60_000);
    start.setMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 30 * 60_000);
    setDraft({
      title: initial?.title ?? "Meeting",
      startAt: initial?.startAt
        ? toLocalInput(initial.startAt)
        : toLocalInput(start.toISOString()),
      endAt: initial?.endAt
        ? toLocalInput(initial.endAt)
        : toLocalInput(end.toISOString()),
      attendees: initial?.attendees ?? "",
      description: initial?.description ?? "",
      addMeetLink: initial?.addMeetLink ?? true,
      contactEmail: initial?.contactEmail,
    });
    setSuggestions([]);
    setAvailabilityNote(null);
    setError(null);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function suggestTimes() {
    setSuggesting(true);
    setError(null);
    try {
      const res = await fetch("/api/calendar/suggest-times", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durationMinutes: 30,
          attendeeEmails: draft.attendees
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const json = (await res.json()) as {
        suggestions?: SuggestedTimeSlot[];
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        throw new Error(json.error ?? "Could not suggest times");
      }
      setSuggestions(json.suggestions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suggest failed");
    } finally {
      setSuggesting(false);
    }
  }

  async function checkAvailability() {
    setChecking(true);
    setError(null);
    try {
      const startAt = new Date(draft.startAt).toISOString();
      const endAt = new Date(draft.endAt).toISOString();
      const res = await fetch("/api/calendar/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeMin: startAt, timeMax: endAt }),
      });
      const json = (await res.json()) as {
        busy?: { start: string; end: string }[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Availability check failed");
      const busy = json.busy ?? [];
      setAvailabilityNote(
        busy.length === 0
          ? "You’re free for this slot."
          : `Conflict: ${busy.length} busy block${busy.length === 1 ? "" : "s"} overlap this time.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Availability failed");
    } finally {
      setChecking(false);
    }
  }

  async function createMeeting() {
    if (!draft.title.trim() || !draft.startAt || !draft.endAt) return;
    setSaving(true);
    setError(null);
    try {
      const attendees = draft.attendees
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title.trim(),
          description: draft.description,
          startAt: new Date(draft.startAt).toISOString(),
          endAt: new Date(draft.endAt).toISOString(),
          attendees,
          addMeetLink: draft.addMeetLink,
          contactEmail: draft.contactEmail ?? attendees[0],
          source: "ai",
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Could not create meeting");
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-meeting-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className={`relative w-full max-w-lg ${dashboard.panelLg} max-h-[90vh] overflow-y-auto`}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-xl border border-white/[0.08] p-2 text-[#A1A1AA] hover:text-white"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-1 flex items-center gap-2 text-[#3B82F6]">
              <CalendarClock className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-[0.14em]">
                AI Scheduling
              </span>
            </div>
            <h2
              id="schedule-meeting-title"
              className="text-xl font-semibold text-white"
            >
              Schedule meeting
            </h2>
            <p className={`mt-1 text-sm ${dashboard.muted}`}>
              Create a Google Calendar event, invite participants, and add Meet.
            </p>

            <div className="mt-5 grid gap-3">
              <input
                value={draft.title}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, title: e.target.value }))
                }
                placeholder="Meeting title"
                className={`${dashboard.input} px-3 py-2.5`}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="datetime-local"
                  value={draft.startAt}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, startAt: e.target.value }))
                  }
                  className={`${dashboard.input} px-3 py-2.5`}
                />
                <input
                  type="datetime-local"
                  value={draft.endAt}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, endAt: e.target.value }))
                  }
                  className={`${dashboard.input} px-3 py-2.5`}
                />
              </div>
              <input
                value={draft.attendees}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, attendees: e.target.value }))
                }
                placeholder="Invite participants (comma-separated emails)"
                className={`${dashboard.input} px-3 py-2.5`}
              />
              <textarea
                value={draft.description}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, description: e.target.value }))
                }
                placeholder="Agenda / notes"
                rows={3}
                className={`${dashboard.input} px-3 py-2.5 resize-none`}
              />
              <label className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                <input
                  type="checkbox"
                  checked={draft.addMeetLink}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, addMeetLink: e.target.checked }))
                  }
                  className="rounded border-white/20 bg-[#0A0A0A] text-[#3B82F6]"
                />
                <Link2 className="h-3.5 w-3.5" />
                Add Google Meet link
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void suggestTimes()}
                disabled={suggesting}
                className={`${dashboard.btnSecondary} inline-flex items-center gap-1.5 px-3 py-2 text-xs`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {suggesting ? "Suggesting…" : "Suggest time"}
              </button>
              <button
                type="button"
                onClick={() => void checkAvailability()}
                disabled={checking}
                className={`${dashboard.btnSecondary} px-3 py-2 text-xs`}
              >
                {checking ? "Checking…" : "Check availability"}
              </button>
            </div>

            {suggestions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.map((slot) => (
                  <button
                    key={slot.startAt}
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        startAt: toLocalInput(slot.startAt),
                        endAt: toLocalInput(slot.endAt),
                      }))
                    }
                    className="rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-3 py-1.5 text-xs text-[#93C5FD] transition hover:bg-[#3B82F6]/20"
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            )}

            {availabilityNote && (
              <p className="mt-3 text-xs text-[#93C5FD]">{availabilityNote}</p>
            )}
            {error && <p className="mt-3 text-xs text-red-300">{error}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`${dashboard.btnSecondary} px-4 py-2`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || !draft.title.trim()}
                onClick={() => void createMeeting()}
                className={`${dashboard.btnPrimary} px-4 py-2 disabled:opacity-60`}
              >
                {saving ? "Creating…" : "Create meeting"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
