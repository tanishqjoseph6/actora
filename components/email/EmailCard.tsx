"use client";

import type { InboxEmail } from "@/lib/gmail";
import { getAvatarGradient, getInitials } from "@/lib/avatar";

type EmailCardProps = {
  email: InboxEmail;
  selected?: boolean;
  onSelect: (email: InboxEmail) => void;
  onAiReply?: (email: InboxEmail) => void;
};

function getPriority(email: InboxEmail): "high" | "normal" | null {
  if (email.starred) return "high";
  if (email.unread && email.subject.toLowerCase().includes("urgent")) return "high";
  return email.unread ? "normal" : null;
}

function getAiSummary(preview: string): string {
  const trimmed = preview.trim();
  if (trimmed.length <= 80) return trimmed;
  return `${trimmed.slice(0, 77)}…`;
}

export function EmailCard({ email, selected, onSelect, onAiReply }: EmailCardProps) {
  const initials = getInitials(email.sender);
  const gradient = getAvatarGradient(email.sender);
  const priority = getPriority(email);
  const aiSummary = getAiSummary(email.preview);

  return (
    <article
      onClick={() => onSelect(email)}
      className={`
        group relative flex gap-3 sm:gap-4 p-4 sm:p-5 rounded-[16px]
        bg-[#0B1730]/50 border transition-all duration-300 ease-out cursor-pointer
        hover:bg-[#0B1730]/90 hover:border-[#00D4FF]/25 hover:shadow-[0_8px_32px_rgba(0,212,255,0.08)]
        hover:-translate-y-0.5
        ${email.unread ? "border-l-2 border-l-[#00D4FF]" : "border-[#00D4FF]/10"}
        ${selected ? "border-[#00D4FF]/40 bg-[#0B1730] shadow-[0_0_24px_rgba(0,212,255,0.12)]" : ""}
      `}
    >
      {email.unread && (
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#00D4FF] shadow-[0_0_8px_#00D4FF]" aria-hidden />
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
                email.unread ? "text-white font-semibold" : "text-gray-200"
              }`}
            >
              {email.sender}
            </p>
            {priority === "high" && (
              <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-rose-500/15 border border-rose-400/30 text-rose-300 uppercase tracking-wide">
                Priority
              </span>
            )}
            {email.unread && (
              <span className="shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#00D4FF]/15 border border-[#00D4FF]/30 text-[#00D4FF]">
                Unread
              </span>
            )}
            {email.starred && (
              <StarIcon className="shrink-0 w-3.5 h-3.5 text-amber-400" />
            )}
          </div>
          <time className="shrink-0 text-xs sm:text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
            {email.date}
          </time>
        </div>

        <p
          className={`mt-1 truncate text-sm sm:text-base ${
            email.unread ? "font-medium text-white" : "text-gray-300"
          }`}
        >
          {email.subject}
        </p>

        <p className="mt-1.5 text-xs text-[#4F8CFF]/80 line-clamp-1">
          <span className="text-gray-600 mr-1">AI:</span>
          {aiSummary}
        </p>

        <p className="mt-1 text-xs sm:text-sm text-gray-500 line-clamp-1 leading-relaxed">
          {email.preview}
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(email);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0B1730] border border-[#00D4FF]/15 text-gray-400 text-xs hover:text-white hover:border-[#00D4FF]/30 transition-colors"
          >
            Quick Reply
          </button>
          {onAiReply && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAiReply(email);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#4F8CFF]/20 to-[#00D4FF]/15 border border-[#00D4FF]/30 text-[#00D4FF] text-xs font-medium hover:from-[#4F8CFF]/30 hover:to-[#00D4FF]/25 transition-all"
              aria-label={`AI Reply to ${email.sender}`}
            >
              <SparkleIcon className="w-3 h-3" />
              AI Reply
            </button>
          )}
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-transparent text-gray-500 text-xs hover:text-gray-300 hover:bg-[#0B1730] transition-colors"
            aria-label="Archive"
          >
            Archive
          </button>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-transparent text-gray-500 text-xs hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            aria-label="Delete"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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
