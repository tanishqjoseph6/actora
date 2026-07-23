"use client";

import { memo } from "react";
import type { InboxEmail } from "@/lib/gmail/message-types";
import { scoreEmailPriority } from "@/lib/gmail/priority";
import { motion } from "framer-motion";
import { getAvatarGradient, getInitials } from "@/lib/avatar";

type EmailCardProps = {
  email: InboxEmail;
  selected?: boolean;
  focused?: boolean;
  bulkMode?: boolean;
  bulkSelected?: boolean;
  onSelect: (email: InboxEmail) => void;
  onAiReply?: (email: InboxEmail) => void;
  onArchive?: (email: InboxEmail) => void;
  onStar?: (email: InboxEmail) => void;
  onSnooze?: (email: InboxEmail) => void;
  onRestore?: (email: InboxEmail) => void;
  onToggleBulk?: (emailId: string) => void;
};

function getPriority(email: InboxEmail): "high" | "medium" | null {
  if (email.priority === "high") return "high";
  if (email.priority === "medium") return "medium";
  const scored = scoreEmailPriority(email);
  if (scored.level === "high") return "high";
  if (scored.level === "medium") return "medium";
  return null;
}

function EmailCardInner({
  email,
  selected,
  focused,
  bulkMode,
  bulkSelected,
  onSelect,
  onAiReply,
  onArchive,
  onStar,
  onSnooze,
  onRestore,
  onToggleBulk,
}: EmailCardProps) {
  const initials = getInitials(email.sender);
  const gradient = getAvatarGradient(email.sender);
  const priority = getPriority(email);

  return (
    <motion.article
      whileTap={{ scale: 0.995 }}
      transition={{ duration: 0.15 }}
      onClick={() => {
        if (bulkMode && onToggleBulk) {
          onToggleBulk(email.id);
          return;
        }
        onSelect(email);
      }}
      className={`
        group relative flex gap-3 sm:gap-4 p-4 sm:p-5 rounded-[16px]
        bg-[#111111] border transition-all duration-200 ease-out cursor-pointer
        hover:-translate-y-0.5 hover:border-[#3B82F6]/50
        ${email.unread ? "border-l-2 border-l-[#3B82F6]" : "border-white/[0.06]"}
        ${selected || focused ? "border-[#3B82F6]/50 bg-[#141414]" : ""}
      `}
    >
      {bulkMode && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleBulk?.(email.id);
          }}
          className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-white/[0.12] bg-[#0A0A0A]"
          aria-label={bulkSelected ? "Deselect email" : "Select email"}
        >
          {bulkSelected && (
            <span className="h-2 w-2 rounded-sm bg-[#3B82F6]" />
          )}
        </button>
      )}

      {email.unread && !bulkMode && (
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#3B82F6]" aria-hidden />
      )}

      <div
        className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xs sm:text-sm font-semibold text-white shadow-md transition-transform duration-300 group-hover:scale-105`}
      >
        {initials}
      </div>

      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <p
              className={`truncate text-sm sm:text-base ${
                email.unread ? "text-white font-semibold" : "text-[#E2E8F0]"
              }`}
            >
              {email.sender}
            </p>
            {priority === "high" && (
              <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#93C5FD] uppercase tracking-wide">
                Priority
              </span>
            )}
            {priority === "medium" && (
              <span className="shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full bg-white/[0.04] border border-white/[0.08] text-[#A1A1AA] uppercase tracking-wide">
                Follow up
              </span>
            )}
            {email.unread && (
              <span className="shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#3B82F6]/15 border border-white/[0.08] text-[#3B82F6]">
                Unread
              </span>
            )}
            {email.starred && (
              <StarIcon className="shrink-0 w-3.5 h-3.5 text-[#3B82F6]" filled />
            )}
            {email.hasAttachments && (
              <PaperclipIcon className="shrink-0 w-3.5 h-3.5 text-[#71717A]" />
            )}
          </div>
          <time className="shrink-0 text-xs sm:text-sm text-[#71717A] group-hover:text-[#A1A1AA] transition-colors">
            {email.date}
          </time>
        </div>

        <p
          className={`mt-1 truncate text-sm sm:text-base ${
            email.unread ? "font-medium text-white" : "text-[#CBD5E1]"
          }`}
        >
          {email.subject}
        </p>

        <p className="mt-1.5 text-xs sm:text-sm text-[#A1A1AA] line-clamp-2 leading-relaxed">
          {email.preview}
        </p>

        {!bulkMode && (
          <div className="flex flex-wrap items-center gap-2 mt-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
            {onAiReply && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAiReply(email);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#3B82F6] text-white text-xs font-medium hover:bg-[#2563EB] transition-colors"
                aria-label={`Reply with AI to ${email.sender}`}
              >
                <SparkleIcon className="w-3 h-3" />
                Reply with AI
              </button>
            )}
            {onStar && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStar(email);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#111111] border border-white/[0.06] text-[#A1A1AA] text-xs hover:text-white hover:border-[#3B82F6]/40 transition-colors"
              >
                <StarIcon className="w-3 h-3" filled={email.starred} />
                {email.starred ? "Unstar" : "Star"}
              </button>
            )}
            {onSnooze && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSnooze(email);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#111111] border border-white/[0.06] text-[#A1A1AA] text-xs hover:text-white hover:border-[#3B82F6]/40 transition-colors"
              >
                Snooze
              </button>
            )}
            {onArchive && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(email);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#111111] border border-white/[0.06] text-[#A1A1AA] text-xs hover:text-white hover:border-[#3B82F6]/40 transition-colors"
                aria-label={`Archive email from ${email.sender}`}
              >
                Archive
              </button>
            )}
            {onRestore && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore(email);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#93C5FD] text-xs hover:bg-[#3B82F6]/20 transition-colors"
              >
                Restore to inbox
              </button>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}

export const EmailCard = memo(EmailCardInner);

function StarIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} fill={filled ? "currentColor" : "none"} viewBox="0 0 20 20" stroke="currentColor" strokeWidth={filled ? 0 : 1.5}>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function PaperclipIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.813 2.659a.75.75 0 01.874 0l1.33.774a.75.75 0 00.874 0l1.33-.774a.75.75 0 011.374.42l.307 1.518a.75.75 0 00.574.574l1.518.307a.75.75 0 010 1.374l-1.518.307a.75.75 0 00-.574.574l-.307 1.518a.75.75 0 01-1.374.42l-1.33-.774a.75.75 0 00-.874 0l-1.33.774a.75.75 0 01-1.374-.42l-.307-1.518a.75.75 0 00-.574-.574l-1.518-.307a.75.75 0 010-1.374l1.518-.307a.75.75 0 00.574-.574l.307-1.518a.75.75 0 01.42-.42zM4 14.25a.75.75 0 01.42.42l.307 1.518a.75.75 0 001.374 0l1.33-.774a.75.75 0 01.874 0l1.33.774a.75.75 0 001.374-.42l.307-1.518a.75.75 0 01.42-.42l1.518-.307a.75.75 0 000-1.374l-1.518-.307a.75.75 0 01-.42-.42l-.307-1.518a.75.75 0 00-1.374 0l-1.33.774a.75.75 0 01-.874 0l-1.33-.774a.75.75 0 00-1.374.42l-.307 1.518a.75.75 0 01-.42.42l-1.518.307a.75.75 0 000 1.374l1.518.307z" />
    </svg>
  );
}
