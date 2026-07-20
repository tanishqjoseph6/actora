"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import type { CalendarEvent } from "@/lib/calendar/types";
import { formatEventTime, sourceLabel } from "@/lib/calendar/view-utils";

export function ContactMeetingsSection({
  contactEmail,
}: {
  contactEmail?: string | null;
}) {
  const [previous, setPrevious] = useState<CalendarEvent[]>([]);
  const [upcoming, setUpcoming] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contactEmail) return;
    let cancelled = false;
    setLoading(true);
    void fetch(
      `/api/calendar/contact-meetings?email=${encodeURIComponent(contactEmail)}`
    )
      .then((res) => res.json())
      .then((json: { previous?: CalendarEvent[]; upcoming?: CalendarEvent[] }) => {
        if (cancelled) return;
        setPrevious(json.previous ?? []);
        setUpcoming(json.upcoming ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contactEmail]);

  if (!contactEmail) {
    return (
      <section className={`${dashboard.cardLg} mt-5 p-5 sm:p-6`}>
        <h2 className="mb-2 text-lg font-bold text-white">Meeting history</h2>
        <p className={`text-sm ${dashboard.subtle}`}>
          Add an email to this contact to see related meetings.
        </p>
      </section>
    );
  }

  return (
    <section className={`${dashboard.cardLg} mt-5 p-5 sm:p-6`}>
      <h2 className="mb-1 text-lg font-bold text-white">Meetings</h2>
      <p className={`mb-5 text-sm ${dashboard.subtle}`}>
        Previous and upcoming meetings with {contactEmail}
      </p>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <MeetingList title="Upcoming" items={upcoming} empty="No upcoming meetings." />
          <MeetingList title="Previous" items={previous} empty="No past meetings yet." />
        </div>
      )}
    </section>
  );
}

function MeetingList({
  title,
  items,
  empty,
}: {
  title: string;
  items: CalendarEvent[];
  empty: string;
}) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-[#52525B]">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className={`text-sm ${dashboard.subtle}`}>{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((event) => (
            <motion.li
              key={event.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-white/[0.06] bg-[#0A0A0A] px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {event.title}
                  </p>
                  <p className={`text-xs ${dashboard.subtle}`}>
                    {new Date(event.startAt).toLocaleDateString()} ·{" "}
                    {formatEventTime(event.startAt)}
                    {event.meetingLink ? " · Meet" : ""}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] text-[#71717A]">
                  {sourceLabel(event.source)}
                </span>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
