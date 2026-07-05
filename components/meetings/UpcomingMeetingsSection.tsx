"use client";

import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import type { Meeting } from "@/lib/meetings/types";
import {
  getMeetingsForDay,
  getRelativeDayLabel,
  getUpcomingMeetings,
  groupMeetingsByDay,
} from "@/lib/meetings/utils";
import { MeetingEventCard } from "./MeetingEventCard";

type UpcomingMeetingsSectionProps = {
  meetings: Meeting[];
  selectedDay: Date;
  dayFilterActive: boolean;
  onClearDayFilter?: () => void;
};

export function UpcomingMeetingsSection({
  meetings,
  selectedDay,
  dayFilterActive,
  onClearDayFilter,
}: UpcomingMeetingsSectionProps) {
  const displayMeetings = dayFilterActive
    ? getMeetingsForDay(meetings, selectedDay).filter(
        (m) => m.status !== "cancelled"
      )
    : getUpcomingMeetings(meetings);

  const groups = groupMeetingsByDay(displayMeetings);
  const selectedLabel = getRelativeDayLabel(selectedDay);

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Upcoming meetings</h2>
          <p className={`text-sm ${dashboard.subtle} mt-0.5`}>
            {dayFilterActive
              ? `${selectedLabel} · ${displayMeetings.length} scheduled`
              : `${displayMeetings.length} meetings ahead`}
          </p>
        </div>
        {dayFilterActive && onClearDayFilter && (
          <button
            type="button"
            onClick={onClearDayFilter}
            className="text-sm text-[#3B82F6] hover:text-[#93C5FD] transition-colors"
          >
            Show all upcoming
          </button>
        )}
      </div>

      {displayMeetings.length === 0 ? (
        <div className={`${dashboard.cardLg} p-10 text-center`}>
          <div className="w-14 h-14 rounded-xl bg-[#0B1220] border border-[#1E293B] flex items-center justify-center mx-auto mb-4 text-2xl">
            📅
          </div>
          <p className="text-white font-medium mb-1">No meetings scheduled</p>
          <p className={`text-sm ${dashboard.subtle}`}>
            {dayFilterActive
              ? `Nothing on the calendar for ${selectedLabel.toLowerCase()}.`
              : "Your calendar is clear — time to focus on deep work."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.date.toISOString()}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  {group.label}
                </h3>
                <div className="flex-1 h-px bg-[#1E293B]" />
                <span className="text-xs text-[#64748B] tabular-nums">
                  {group.meetings.length}
                </span>
              </div>
              <div className="space-y-3">
                {group.meetings.map((meeting, i) => (
                  <MeetingEventCard key={meeting.id} meeting={meeting} index={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
