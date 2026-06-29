"use client";

import type { InboxEmail } from "@/lib/gmail";
import { getAvatarGradient, getInitials } from "@/lib/avatar";

type EmailCardProps = {
  email: InboxEmail;
  selected?: boolean;
  onSelect: (email: InboxEmail) => void;
  onAiReply?: (email: InboxEmail) => void;
};

export function EmailCard({ email, selected, onSelect, onAiReply }: EmailCardProps) {
  const initials = getInitials(email.sender);
  const gradient = getAvatarGradient(email.sender);

  return (
    <article
      onClick={() => onSelect(email)}
      className={`
        group relative flex gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl
        bg-[#0d1730]/60 border transition-all duration-300 ease-out
        hover:bg-[#0d1730] hover:border-cyan-400/30 hover:shadow-lg hover:shadow-cyan-500/5
        hover:-translate-y-0.5 cursor-pointer
        ${email.unread ? "border-l-2 border-l-cyan-400" : "border-cyan-400/10"}
        ${selected ? "border-cyan-400/40 bg-[#0d1730] shadow-lg shadow-cyan-500/10" : ""}
      `}
    >
      <div
        className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-xs sm:text-sm font-semibold text-white shadow-md transition-transform duration-300 group-hover:scale-105`}
      >
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <p
              className={`truncate text-sm sm:text-base ${
                email.unread ? "text-white font-semibold" : "text-gray-200"
              }`}
            >
              {email.sender}
            </p>
            {email.unread && (
              <span className="shrink-0 px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300">
                Unread
              </span>
            )}
            {email.starred && (
              <StarIcon className="shrink-0 w-3.5 h-3.5 text-amber-400" />
            )}
          </div>
          <time className="shrink-0 text-xs sm:text-sm text-gray-500 group-hover:text-gray-400 transition-colors duration-200">
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

        <p className="mt-1 text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed group-hover:text-gray-400 transition-colors duration-200">
          {email.preview}
        </p>

        {onAiReply && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAiReply(email);
            }}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-400/25 text-cyan-300 text-xs font-medium opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-cyan-500/20 transition-all duration-200"
            aria-label={`AI Reply to ${email.sender}`}
          >
            <SparkleIcon className="w-3.5 h-3.5" />
            AI Reply
          </button>
        )}
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
