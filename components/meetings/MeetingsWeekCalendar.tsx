"use client";

import { motion } from "framer-motion";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import type { Meeting } from "@/lib/meetings/types";
import {
  formatMeetingTime,
  getMeetingsForDay,
  getWeekDays,
  isSameDay,
} from "@/lib/meetings/utils";

type MeetingsWeekCalendarProps = {
  meetings: Meeting[];
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
};

export function MeetingsWeekCalendar({
  meetings,
  selectedDay,
  onSelectDay,
}: MeetingsWeekCalendarProps) {
  const weekDays = getWeekDays();
  const today = new Date();

  return (
    <section className={`${dashboard.cardLg} p-4 sm:p-5`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white">This week</h2>
          <p className={`text-xs ${dashboard.subtle} mt-0.5`}>
            {weekDays[0].toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
        {weekDays.map((day, i) => {
          const dayMeetings = getMeetingsForDay(meetings, day).filter(
            (m) => m.status !== "cancelled"
          );
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDay);

          return (
            <motion.button
              key={day.toISOString()}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onSelectDay(day)}
              className={`
                flex flex-col rounded-xl border p-3 sm:p-4 text-left transition-all duration-200 min-h-[120px] sm:min-h-[140px]
                ${
                  isSelected
                    ? "border-[#3B82F6]/60 bg-[#3B82F6]/10 ring-1 ring-[#2563EB]/25"
                    : "border-white/[0.06] bg-[#0A0A0A] hover:border-[#3B82F6]/35"
                }
                ${isToday && !isSelected ? "border-[#3B82F6]/30" : ""}
              `}
            >
              <span className={`text-[10px] uppercase tracking-wider font-medium ${dashboard.subtle}`}>
                {day.toLocaleDateString(undefined, { weekday: "short" })}
              </span>
              <span
                className={`text-2xl font-bold tabular-nums mt-1 ${
                  isToday ? "text-[#3B82F6]" : "text-white"
                }`}
              >
                {day.getDate()}
              </span>

              <div className="mt-auto pt-3 space-y-1.5 w-full">
                {dayMeetings.length === 0 ? (
                  <span className={`text-[10px] ${dashboard.subtle}`}>No meetings</span>
                ) : (
                  <>
                    {dayMeetings.slice(0, 2).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-1.5 min-w-0"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] shrink-0" />
                        <span className="text-[10px] text-[#A1A1AA] truncate">
                          {formatMeetingTime(m.startAt)} · {m.title}
                        </span>
                      </div>
                    ))}
                    {dayMeetings.length > 2 && (
                      <span className="text-[10px] text-[#3B82F6] font-medium">
                        +{dayMeetings.length - 2} more
                      </span>
                    )}
                  </>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
