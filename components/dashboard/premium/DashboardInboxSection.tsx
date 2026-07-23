"use client";

import { motion } from "framer-motion";
import type { InboxEmail } from "@/lib/gmail/message-types";
import { EmailCard } from "@/components/email/EmailCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { PremiumEmptyState } from "@/components/ui/PremiumEmptyState";
import { LockedFeaturePanel } from "@/components/subscription/FeatureGate";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { dashboard } from "./dashboard-tokens";

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
  const { canAccessFeature } = usePlanGate();

  return (
    <motion.section
      id="inbox"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      className={`${dashboard.cardLg} p-5 sm:p-6 lg:p-7`}
    >
      {!canAccessFeature("shared_inbox") && (
        <div className="mb-5">
          <LockedFeaturePanel feature="shared_inbox" compact />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">Inbox</h2>
          <p className={`text-sm mt-0.5 ${dashboard.subtle}`}>AI-powered email management</p>
        </div>
        {isRefreshing && (
          <span className="text-sm text-[#3B82F6] animate-pulse">Refreshing…</span>
        )}
      </div>

      <div className="relative mb-4 sm:hidden">
        <SearchIcon className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${dashboard.subtle}`} />
        <input
          type="search"
          placeholder="Search emails…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`${dashboard.input} pl-10 pr-4 py-2.5`}
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
        <div className={`${dashboard.cardBase} border-[#EF4444]/20 p-6`}>
          <p className="text-[#FCA5A5] font-medium mb-2">Could not load Gmail inbox</p>
          <p className={`${dashboard.muted} text-sm mb-4`}>{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className={`${dashboard.btnSecondary} px-4 py-2 text-sm`}
          >
            Try again
          </button>
        </div>
      )}

      {fetchState === "success" && filteredEmails.length === 0 && (
        <EmptyInboxState
          filter={activeFilter}
          hasSearch={searchQuery.trim().length > 0}
          onClearFilters={() => {
            onSearchChange("");
            onFilterChange("all");
          }}
          onRetry={onRetry}
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
          ? "bg-[#3B82F6] text-white border border-[#3B82F6]"
          : "bg-[#0A0A0A] border border-white/[0.06] text-[#A1A1AA] hover:border-[#3B82F6]/40 hover:text-white"
        }
      `}
    >
      {label}
      <span className={`text-xs tabular-nums ${active ? "text-white/80" : dashboard.subtle}`}>
        {count}
      </span>
    </button>
  );
}

function EmailSkeletonList() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading emails">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 p-4 sm:p-5 rounded-xl bg-[#0A0A0A] border border-white/[0.06]"
        >
          <Skeleton className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="flex justify-between gap-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyInboxState({
  filter,
  hasSearch,
  onClearFilters,
  onRetry,
}: {
  filter: FilterChip;
  hasSearch: boolean;
  onClearFilters: () => void;
  onRetry: () => void;
}) {
  const hasActiveFilters = hasSearch || filter !== "all";

  if (hasActiveFilters) {
    return (
      <PremiumEmptyState
        illustration="inbox"
        title={
          hasSearch
            ? "No emails match your search"
            : filter === "unread"
              ? "No unread emails"
              : "No starred emails"
        }
        description="Try a different search term or reset your filters to see all messages."
        cta={{ label: "Clear filters", onClick: onClearFilters }}
        className="border-0 bg-transparent shadow-none py-10"
      />
    );
  }

  return (
    <PremiumEmptyState
      illustration="inbox"
      title="Your inbox is clear"
      description="New Gmail messages will sync here automatically with AI summaries ready when they arrive."
      cta={{ label: "Refresh inbox", onClick: onRetry }}
      className="border-0 bg-transparent shadow-none py-10"
    />
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

