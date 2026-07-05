"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { EmailCard } from "@/components/email/EmailCard";
import { EmailDetailPanel } from "@/components/email/EmailDetailPanel";
import { CurrentPlanBadge } from "@/components/subscription/CurrentPlanBadge";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { useGmailAccounts } from "@/hooks/useGmailAccounts";
import { useInbox } from "@/hooks/useInbox";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { Skeleton } from "@/components/ui/Skeleton";

type InboxViewProps = {
  /** Compact layout for embedding on the dashboard overview */
  compact?: boolean;
};

export function InboxView({ compact = false }: InboxViewProps) {
  const { subscription, loading: planLoading } = usePlanGate();
  const { connected, loading: accountsLoading } = useGmailAccounts();
  const inbox = useInbox();

  const showConnectPrompt = !accountsLoading && !connected;

  return (
    <>
      {!compact && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 lg:mb-8">
          <div>
            <p className={`text-sm ${dashboard.subtle} mb-2`}>📥 Mail</p>
            <h1 className={dashboard.pageTitle}>AI Inbox</h1>
            <p className={`${dashboard.muted} mt-2 text-sm sm:text-base max-w-xl`}>
              Gmail messages with AI summaries, smart replies, and one-click actions.
            </p>
          </div>
          <CurrentPlanBadge
            subscription={subscription}
            loading={planLoading}
            compact
          />
        </div>
      )}

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${dashboard.cardLg} ${compact ? "p-5 sm:p-6" : "p-5 sm:p-6 lg:p-7"}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {compact ? "Inbox" : "Messages"}
            </h2>
            <p className={`text-sm mt-0.5 ${dashboard.subtle}`}>
              {inbox.fetchState === "success"
                ? `${inbox.emails.length} email${inbox.emails.length === 1 ? "" : "s"}`
                : "Loading your Gmail inbox"}
            </p>
          </div>
          {inbox.isRefreshing && (
            <span className="text-sm text-[#3B82F6] animate-pulse">Refreshing…</span>
          )}
        </div>

        <div className="relative mb-4">
          <SearchIcon className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${dashboard.subtle}`} />
          <input
            type="search"
            placeholder="Search sender, subject, or preview…"
            value={inbox.searchQuery}
            onChange={(e) => inbox.setSearchQuery(e.target.value)}
            className={`${dashboard.input} pl-10 pr-4 py-2.5`}
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          <FilterChip
            label="All"
            count={inbox.emails.length}
            active={inbox.activeFilter === "all"}
            onClick={() => inbox.setActiveFilter("all")}
          />
          <FilterChip
            label="Unread"
            count={inbox.unreadCount}
            active={inbox.activeFilter === "unread"}
            onClick={() => inbox.setActiveFilter("unread")}
          />
          <FilterChip
            label="Starred"
            count={inbox.starredCount}
            active={inbox.activeFilter === "starred"}
            onClick={() => inbox.setActiveFilter("starred")}
          />
        </div>

        {showConnectPrompt && (
          <ConnectGmailState error={inbox.error} />
        )}

        {!showConnectPrompt && inbox.fetchState === "loading" && (
          <EmailSkeletonList />
        )}

        {!showConnectPrompt && inbox.fetchState === "error" && (
          <ErrorState error={inbox.error} onRetry={() => inbox.loadEmails()} />
        )}

        {!showConnectPrompt &&
          inbox.fetchState === "success" &&
          inbox.filteredEmails.length === 0 && (
            <EmptyState
              filter={inbox.activeFilter}
              hasSearch={inbox.searchQuery.trim().length > 0}
            />
          )}

        {!showConnectPrompt &&
          inbox.fetchState === "success" &&
          inbox.filteredEmails.length > 0 && (
            <div
              className={`space-y-2 pr-1 premium-scrollbar ${
                compact ? "max-h-[520px] overflow-y-auto" : "max-h-[calc(100vh-22rem)] overflow-y-auto"
              }`}
            >
              {inbox.filteredEmails.map((email, i) => (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                >
                  <EmailCard
                    email={email}
                    selected={inbox.selectedEmail?.id === email.id}
                    onSelect={inbox.openEmail}
                    onAiReply={inbox.openEmailWithAiReply}
                    onArchive={(target) => void inbox.archiveEmailById(target.id)}
                  />
                </motion.div>
              ))}
            </div>
          )}
      </motion.section>

      {inbox.selectedEmail && (
        <EmailDetailPanel
          email={inbox.selectedEmail}
          onClose={inbox.closeEmail}
          openAiReply={inbox.openAiReply}
          onAiReplyOpened={() => inbox.setOpenAiReply(false)}
          onMarkRead={() => void inbox.markEmailRead(inbox.selectedEmail!.id)}
          onArchive={async () => {
            const archived = await inbox.archiveEmailById(inbox.selectedEmail!.id);
            return archived;
          }}
        />
      )}
    </>
  );
}

function FilterChip({
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
          ? "bg-[#2563EB] text-white border border-[#2563EB]"
          : "bg-[#0B1220] border border-[#1E293B] text-[#94A3B8] hover:border-[#2563EB]/40 hover:text-white"
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

function ConnectGmailState({ error }: { error: string | null }) {
  return (
    <div className={`${dashboard.cardBase} p-8 text-center`}>
      <div className="w-14 h-14 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/25 flex items-center justify-center mx-auto mb-5">
        <InboxIcon className="w-7 h-7 text-[#2563EB]" />
      </div>
      <p className="text-white font-semibold mb-2">Connect Gmail to get started</p>
      <p className={`text-sm ${dashboard.muted} mb-6 max-w-md mx-auto`}>
        {error ??
          "Link your Gmail account to fetch messages, generate AI summaries, and reply from Actora."}
      </p>
      <Link href="/dashboard/connect-gmail" className={`${dashboard.btnPrimary} px-5 py-2.5 text-sm`}>
        Connect Gmail
      </Link>
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <div className={`${dashboard.cardBase} border-[#EF4444]/20 p-6`}>
      <p className="text-[#FCA5A5] font-medium mb-2">Could not load Gmail inbox</p>
      <p className={`${dashboard.muted} text-sm mb-4`}>{error}</p>
      <button type="button" onClick={onRetry} className={`${dashboard.btnSecondary} px-4 py-2 text-sm`}>
        Try again
      </button>
    </div>
  );
}

function EmptyState({
  filter,
  hasSearch,
}: {
  filter: "all" | "unread" | "starred";
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
      <div className="w-14 h-14 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/25 flex items-center justify-center mb-5">
        <InboxIcon className="w-7 h-7 text-[#2563EB]" />
      </div>
      <p className="text-white font-medium mb-1">{message}</p>
      <p className={`text-sm ${dashboard.subtle}`}>
        {hasSearch
          ? "Try a different search term or clear filters."
          : "New messages will appear here automatically."}
      </p>
    </div>
  );
}

function EmailSkeletonList() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading emails">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 p-4 sm:p-5 rounded-xl bg-[#0B1220] border border-[#1E293B]"
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
