"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import type { Meeting, MeetingType } from "@/lib/meetings/types";
import {
  formatMeetingDuration,
  formatMeetingTime,
} from "@/lib/meetings/utils";

const TYPE_STYLES: Record<
  MeetingType,
  { label: string; icon: string; badge: string }
> = {
  video: {
    label: "Video",
    icon: "📹",
    badge: "bg-[#3B82F6]/15 border-[#3B82F6]/35 text-[#93C5FD]",
  },
  "in-person": {
    label: "In person",
    icon: "📍",
    badge: "bg-[#1E293B] border-[#334155] text-[#A1A1AA]",
  },
  phone: {
    label: "Phone",
    icon: "📞",
    badge: "bg-[#0A0A0A] border-white/[0.06] text-[#71717A]",
  },
};

type MeetingEventCardProps = {
  meeting: Meeting;
  index?: number;
  onEdit?: (meeting: Meeting) => void;
  onDelete?: (meeting: Meeting) => void;
};

export function MeetingEventCard({
  meeting,
  index = 0,
  onEdit,
  onDelete,
}: MeetingEventCardProps) {
  const typeStyle = TYPE_STYLES[meeting.type];
  const isScheduled = meeting.status === "scheduled";

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileTap={{ scale: 0.995 }}
      className={`group ${dashboard.cardInteractive} p-4 sm:p-5`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex sm:flex-col items-center sm:items-start gap-2 sm:gap-1 sm:min-w-[72px] shrink-0">
          <span className="text-lg font-bold text-white tabular-nums">
            {formatMeetingTime(meeting.startAt)}
          </span>
          <span className={`text-xs ${dashboard.subtle} tabular-nums`}>
            {formatMeetingDuration(meeting.startAt, meeting.endAt)}
          </span>
        </div>

        <div className="hidden sm:block w-px self-stretch bg-[#1E293B] shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="text-base font-semibold text-white group-hover:text-[#93C5FD] transition-colors">
              {meeting.title}
            </h3>
            {isScheduled && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border border-[#334155] text-[#71717A] bg-[#0A0A0A]">
                Scheduled
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${typeStyle.badge}`}
            >
              <span aria-hidden>{typeStyle.icon}</span>
              {typeStyle.label}
            </span>
          </div>

          {meeting.companyName && (
            <p className="text-sm text-[#3B82F6] mb-1">{meeting.companyName}</p>
          )}

          <p className={`text-sm ${dashboard.muted} line-clamp-2`}>
            {meeting.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
            {meeting.location && (
              <MetaItem icon={<PinIcon className="w-3.5 h-3.5" />}>
                {meeting.location}
              </MetaItem>
            )}
            {meeting.meetingLink && (
              <MetaItem icon={<LinkIcon className="w-3.5 h-3.5" />}>
                <span className="text-[#3B82F6]">Join video call</span>
              </MetaItem>
            )}
            <MetaItem icon={<UsersIcon className="w-3.5 h-3.5" />}>
              {meeting.attendees.length} attendee
              {meeting.attendees.length !== 1 ? "s" : ""}
            </MetaItem>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {meeting.attendees.slice(0, 4).map((name) => (
              <span
                key={name}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium border border-white/[0.06] bg-[#0A0A0A] text-[#A1A1AA]"
              >
                {name}
              </span>
            ))}
            {meeting.attendees.length > 4 && (
              <span className="px-2 py-0.5 text-[10px] text-[#71717A]">
                +{meeting.attendees.length - 4}
              </span>
            )}
          </div>
        </div>

        <div className="flex sm:flex-col gap-2 shrink-0">
          {meeting.meetingLink && (
            <button
              type="button"
              className={`${dashboard.btnPrimary} px-3 py-2 text-xs w-full sm:w-auto`}
              onClick={() => window.open(meeting.meetingLink, "_blank")}
            >
              Join
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(meeting)}
              className={`${dashboard.btnSecondary} px-3 py-2 text-xs w-full sm:w-auto`}
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(meeting)}
              className="px-3 py-2 text-xs rounded-lg border border-[#7F1D1D] text-[#FCA5A5] bg-[#7F1D1D]/10 hover:bg-[#7F1D1D]/20 w-full sm:w-auto"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function MetaItem({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[#71717A]">
      {icon}
      {children}
    </span>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
