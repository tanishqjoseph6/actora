"use client";

import { motion } from "framer-motion";
import type { InboxEmail } from "@/lib/gmail";
import { EmailCard } from "@/components/email/EmailCard";

type FilterChip = "all" | "unread" | "starred";
type FetchState = "loading" | "error" | "success";

type DashboardInboxSectionProps = {
  fetchState: FetchState;
  error: string | null;
  isRefreshing: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeFilter: FilterChip;
  onFilterChange: (filter: FilterChip) => void;
  emails: InboxEmail[];
  filteredEmails: InboxEmail[];
  unreadCount: number;
  starredCount: number;
  selectedEmailId: string | null;
  onSelectEmail: (email: InboxEmail) => void;
  onAiReply: (email: InboxEmail) => void;
  onRetry: () => void;
};

export function DashboardInboxSection({
  fetchState,
  error,
  isRefreshing,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  emails,
  filteredEmails,
  unreadCount,
  starredCount,
  selectedEmailId,
  onSelectEmail,
  onAiReply,
  onRetry,
}: DashboardInboxSectionProps) {
  return (
    <motion.section
      id="inbox"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      className="rounded-[20px] bg-[#071426]/70 border border-[#00D4FF]/10 backdrop-blur-xl p-5 sm:p-6 lg:p-7"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Inbox</h2>
          <p className="text-sm text-gray-500 mt-0.5">AI-powered email management</p>
        </div>
        {isRefreshing && (
          <span className="text-sm text-[#00D4FF]/70 animate-pulse">Refreshing…</span>
        )}
      </div>

      <div className="relative mb-4 sm:hidden">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="search"
          placeholder="Search emails…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-[14px] bg-[#0B1730]/80 border border-[#00D4FF]/10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00D4FF]/35"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <FilterChipButton
          label="All"
          count={emails.length}
          active={activeFilter === "all"}
          onClick={() => onFilterChange("all")}
        />
        <FilterChipButton
          label="Unread"
          count={unreadCount}
          active={activeFilter === "unread"}
          onClick={() => onFilterChange("unread")}
        />
        <FilterChipButton
          label="Starred"
          count={starredCount}
          active={activeFilter === "starred"}
          onClick={() => onFilterChange("starred")}
        />
      </div>

      {fetchState === "loading" && <EmailSkeletonList />}

      {fetchState === "error" && (
        <div className="rounded-[16px] bg-[#0B1730]/60 border border-rose-400/20 p-6">
          <p className="text-rose-300 font-medium mb-2">Could not load Gmail inbox</p>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 rounded-[12px] border border-[#00D4FF]/30 text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {fetchState === "success" && filteredEmails.length === 0 && (
        <EmptyInboxState
          filter={activeFilter}
          hasSearch={searchQuery.trim().length > 0}
        />
      )}

      {fetchState === "success" && filteredEmails.length > 0 && (
        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 premium-scrollbar">
          {filteredEmails.map((email, i) => (
            <motion.div
              key={email.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
            >
              <EmailCard
                email={email}
                selected={selectedEmailId === email.id}
                onSelect={onSelectEmail}
                onAiReply={onAiReply}
              />
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  );
}

function FilterChipButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200
        ${active
          ? "bg-gradient-to-r from-[#4F8CFF]/25 to-[#00D4FF]/15 border border-[#00D4FF]/35 text-[#00D4FF] shadow-[0_0_16px_rgba(0,212,255,0.1)]"
          : "bg-[#0B1730]/60 border border-[#00D4FF]/10 text-gray-400 hover:border-[#00D4FF]/25 hover:text-gray-300"
        }
      `}
    >
      {label}
      <span className={`text-xs tabular-nums ${active ? "text-[#00D4FF]/80" : "text-gray-500"}`}>
        {count}
      </span>
    </button>
  );
}

function EmailSkeletonList() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 p-4 sm:p-5 rounded-[16px] bg-[#0B1730]/40 border border-[#00D4FF]/5 animate-pulse"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#00D4FF]/10 shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="flex justify-between">
              <div className="h-4 w-28 bg-[#00D4FF]/10 rounded" />
              <div className="h-3 w-12 bg-[#00D4FF]/10 rounded" />
            </div>
            <div className="h-4 w-2/3 bg-[#00D4FF]/10 rounded" />
            <div className="h-3 w-full bg-[#00D4FF]/10 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyInboxState({
  filter,
  hasSearch,
}: {
  filter: FilterChip;
  hasSearch: boolean;
}) {
  const message = hasSearch
    ? "No emails match your search."
    : filter === "unread"
      ? "You're all caught up — no unread emails."
      : filter === "starred"
        ? "No starred emails yet."
        : "Your inbox is empty.";

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-[16px] bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center mb-5">
        <InboxIcon className="w-8 h-8 text-[#00D4FF]/60" />
      </div>
      <p className="text-gray-300 font-medium mb-1">{message}</p>
      <p className="text-sm text-gray-500">
        {hasSearch
          ? "Try a different search term or clear filters."
          : "New messages will appear here automatically."}
      </p>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
    </svg>
  );
}
