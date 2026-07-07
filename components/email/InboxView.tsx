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
import { PremiumEmptyState } from "@/components/ui/PremiumEmptyState";

type InboxViewProps = {
  /** Compact layout for embedding on the dashboard overview */
  compact?: boolean;
};

export function InboxView({ compact = false }: InboxViewProps) {
  const { subscription, loading: planLoading } = usePlanGate();
  const { connected, loading: accountsLoading, accounts, selectedEmail: activeAccountEmail, setSelectedEmail: setActiveAccount } = useGmailAccounts();
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

        {!showConnectPrompt && accounts.length > 1 && (
          <div className="mb-4">
            <label htmlFor="inbox-account" className={`block text-xs font-medium ${dashboard.subtle} mb-2`}>
              Gmail account
            </label>
            <select
              id="inbox-account"
              value={activeAccountEmail ?? ""}
              onChange={(event) => setActiveAccount(event.target.value)}
              className={`${dashboard.input} px-4 py-2.5 max-w-md`}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.email}>
                  {account.email}
                </option>
              ))}
            </select>
          </div>
        )}

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
          <ErrorState
            error={inbox.error}
            onRetry={() => inbox.loadEmails()}
          />
        )}

        {!showConnectPrompt &&
          inbox.fetchState === "success" &&
          inbox.filteredEmails.length === 0 && (
            <EmptyState
              filter={inbox.activeFilter}
              hasSearch={inbox.searchQuery.trim().length > 0}
              onClearFilters={() => {
                inbox.setSearchQuery("");
                inbox.setActiveFilter("all");
              }}
              onRefresh={() => inbox.loadEmails()}
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
          accountEmail={inbox.activeAccountEmail}
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
    <PremiumEmptyState
      illustration="inbox"
      title="Connect Gmail to unlock your AI inbox"
      description={
        error ??
        "Link Gmail to pull in messages, get AI summaries on every thread, and draft smart replies without leaving Actora."
      }
      cta={{ label: "Connect Gmail", href: "/dashboard/connect-gmail" }}
      className="border-dashed bg-[#0B1220]/50"
    />
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: string | null;
  onRetry: () => void;
}) {
  const needsReconnect =
    error?.toLowerCase().includes("reconnect") ||
    error?.toLowerCase().includes("expired") ||
    error?.toLowerCase().includes("not connected");

  return (
    <div className={`${dashboard.cardBase} border-[#EF4444]/20 p-6`}>
      <p className="text-[#FCA5A5] font-medium mb-2">Could not load Gmail inbox</p>
      <p className={`${dashboard.muted} text-sm mb-4`}>{error}</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onRetry} className={`${dashboard.btnSecondary} px-4 py-2 text-sm`}>
          Try again
        </button>
        {needsReconnect && (
          <Link href="/dashboard/connect-gmail" className={`${dashboard.btnPrimary} px-4 py-2 text-sm`}>
            Reconnect Gmail
          </Link>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  filter,
  hasSearch,
  onClearFilters,
  onRefresh,
}: {
  filter: "all" | "unread" | "starred";
  hasSearch: boolean;
  onClearFilters: () => void;
  onRefresh: () => void;
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
        className="border-0 bg-transparent shadow-none"
      />
    );
  }

  return (
    <PremiumEmptyState
      illustration="inbox"
      title="Your inbox is clear"
      description="New Gmail messages will sync here automatically. AI summaries and one-click replies are ready when they arrive."
      cta={{ label: "Refresh inbox", onClick: onRefresh }}
      className="border-0 bg-transparent shadow-none"
    />
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

