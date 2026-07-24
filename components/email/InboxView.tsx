"use client";

import { Suspense, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, PenSquare } from "lucide-react";
import { EmailCard } from "@/components/email/EmailCard";
import { EmailDetailPanel } from "@/components/email/EmailDetailPanel";
import { InboxContentSkeleton } from "@/components/email/InboxContentSkeleton";
import { CurrentPlanBadge } from "@/components/subscription/CurrentPlanBadge";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { useGmailAccounts } from "@/hooks/useGmailAccounts";
import {
  isGmailReconnectRequired,
  useGmailReconnect,
} from "@/hooks/useGmailReconnect";
import { useGmailOAuthCallback } from "@/hooks/useGmailOAuthCallback";
import { useInbox } from "@/hooks/useInbox";
import { useInboxKeyboardShortcuts } from "@/hooks/useInboxKeyboardShortcuts";
import { useToast } from "@/providers/ToastProvider";
import { SNOOZE_OPTIONS } from "@/lib/email/snooze-store";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { Skeleton } from "@/components/ui/Skeleton";
import { PremiumEmptyState } from "@/components/ui/PremiumEmptyState";

type InboxViewProps = {
  /** Compact layout for embedding on the dashboard overview */
  compact?: boolean;
};

export function InboxView({ compact = false }: InboxViewProps) {
  return (
    <Suspense fallback={<InboxContentSkeleton compact={compact} />}>
      <InboxViewInner compact={compact} />
    </Suspense>
  );
}

function InboxViewInner({ compact = false }: InboxViewProps) {
  const { subscription, loading: planLoading } = usePlanGate();
  const { showToast } = useToast();
  const {
    connected,
    loading: accountsLoading,
    accounts,
    selectedEmail: activeAccountEmail,
    setSelectedEmail: setActiveAccount,
    refresh: refreshAccounts,
  } = useGmailAccounts();
  const { reconnectGmail, reconnecting } = useGmailReconnect();
  const inbox = useInbox();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const oauthCallback = useGmailOAuthCallback({
    onSuccess: async (data) => {
      await refreshAccounts();
      await inbox.loadEmails(false, true);
      showToast({
        type: "success",
        title: data.reconnected ? "Gmail reconnected" : "Gmail connected",
        message: data.reconnected
          ? `${data.account.email} is linked again. Your inbox is refreshing.`
          : `${data.account.email} is ready. Your inbox is loading.`,
      });
    },
  });

  useEffect(() => {
    if (oauthCallback.tone === "error" && oauthCallback.message) {
      showToast({
        type: "error",
        title: "Gmail reconnect failed",
        message: oauthCallback.message,
      });
    }
  }, [oauthCallback.message, oauthCallback.tone, showToast]);

  const showConnectPrompt = !accountsLoading && !connected;
  const sessionBusy = reconnecting || oauthCallback.connecting;

  const handleReconnect = useCallback(async () => {
    if (reconnecting || oauthCallback.connecting) return;
    try {
      await reconnectGmail(activeAccountEmail);
    } catch {
      showToast({
        type: "error",
        title: "Could not start reconnect",
        message: "Please try again in a moment.",
      });
    }
  }, [
    activeAccountEmail,
    oauthCallback.connecting,
    reconnectGmail,
    reconnecting,
    showToast,
  ]);

  const handleRetry = useCallback(async () => {
    if (
      sessionBusy ||
      isGmailReconnectRequired(inbox.error, inbox.errorCode) ||
      !connected
    ) {
      await handleReconnect();
      return;
    }

    await inbox.loadEmails(false, true);
  }, [
    connected,
    handleReconnect,
    inbox,
    sessionBusy,
  ]);

  const handleSnooze = useCallback(
    (email: Parameters<typeof inbox.snoozeEmailById>[0]) => {
      void inbox.snoozeEmailById(email, SNOOZE_OPTIONS[1].hours);
    },
    [inbox]
  );

  const handleStar = useCallback(
    (email: { id: string; starred: boolean }) => {
      void inbox.toggleStar(email.id, !email.starred);
    },
    [inbox]
  );

  useInboxKeyboardShortcuts({
    enabled: !showConnectPrompt,
    filteredEmails: inbox.filteredEmails,
    listFocusIndex: inbox.listFocusIndex,
    selectedEmail: inbox.selectedEmail,
    searchInputRef,
    onFocusSearch: () => searchInputRef.current?.focus(),
    onOpenEmail: inbox.openEmail,
    onOpenAiReply: inbox.openEmailWithAiReply,
    onArchive: (email) => void inbox.archiveEmailById(email.id),
    onStar: handleStar,
    onClosePanel: inbox.closeEmail,
    onMoveFocus: inbox.focusEmailAt,
  });

  return (
    <>
      {!compact && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 lg:mb-8">
          <div>
            <p className={`text-sm ${dashboard.subtle} mb-2`}>Mail</p>
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
            ref={searchInputRef}
            type="search"
            placeholder="Search sender, subject, or preview…"
            value={inbox.searchQuery}
            onChange={(e) => inbox.setSearchQuery(e.target.value)}
            className={`${dashboard.input} pl-10 pr-4 py-2.5`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-5">
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
          <FilterChip
            label="Priority"
            count={inbox.priorityCount}
            active={inbox.activeFilter === "priority"}
            onClick={() => inbox.setActiveFilter("priority")}
          />
          <FilterChip
            label="Snoozed"
            count={inbox.snoozedCount}
            active={inbox.activeFilter === "snoozed"}
            onClick={() => inbox.setActiveFilter("snoozed")}
          />
          {!compact && inbox.filteredEmails.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (inbox.bulkMode) inbox.clearSelection();
                else inbox.setBulkMode(true);
              }}
              className={`ml-auto inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                inbox.bulkMode
                  ? "bg-[#3B82F6]/15 border border-[#3B82F6]/40 text-[#93C5FD]"
                  : "bg-[#0A0A0A] border border-white/[0.08] text-[#A1A1AA] hover:border-[#3B82F6]/40 hover:text-white"
              }`}
            >
              {inbox.bulkMode ? "Cancel select" : "Select"}
            </button>
          )}
        </div>

        {inbox.bulkMode && inbox.selectedIds.size > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#3B82F6]/25 bg-[#3B82F6]/[0.07] px-3 py-2.5">
            <span className="text-sm text-[#93C5FD]">
              {inbox.selectedIds.size} selected
            </span>
            <button
              type="button"
              onClick={inbox.selectAllVisible}
              className="text-xs text-[#A1A1AA] hover:text-white"
            >
              Select all
            </button>
            <div className="ml-auto flex flex-wrap gap-2">
              <BulkButton onClick={() => void inbox.runBulkAction("read")}>
                Mark read
              </BulkButton>
              <BulkButton onClick={() => void inbox.runBulkAction("star")}>
                Star
              </BulkButton>
              <BulkButton onClick={() => void inbox.runBulkAction("archive")}>
                Archive
              </BulkButton>
            </div>
          </div>
        )}

        {showConnectPrompt && (
          <ConnectGmailState
            error={inbox.error}
            errorCode={inbox.errorCode}
            onReconnect={() => void handleReconnect()}
            reconnecting={sessionBusy}
          />
        )}

        {!showConnectPrompt && inbox.fetchState === "loading" && (
          <EmailSkeletonList />
        )}

        {!showConnectPrompt && inbox.fetchState === "error" && (
          <ErrorState
            error={inbox.error}
            errorCode={inbox.errorCode}
            onRetry={() => void handleRetry()}
            onReconnect={() => void handleReconnect()}
            reconnecting={sessionBusy}
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
                  <EmailCard
                    key={email.id}
                    email={email}
                    selected={inbox.selectedEmail?.id === email.id}
                    focused={inbox.listFocusIndex === i && !inbox.selectedEmail}
                    bulkMode={inbox.bulkMode}
                    bulkSelected={inbox.selectedIds.has(email.id)}
                    onSelect={inbox.openEmail}
                    onAiReply={inbox.openEmailWithAiReply}
                    onArchive={
                      inbox.activeFilter === "snoozed"
                        ? undefined
                        : (target) => void inbox.archiveEmailById(target.id)
                    }
                    onStar={
                      inbox.activeFilter === "snoozed" ? undefined : handleStar
                    }
                    onSnooze={
                      inbox.activeFilter === "snoozed" ? undefined : handleSnooze
                    }
                    onRestore={
                      inbox.activeFilter === "snoozed"
                        ? (target) => void inbox.restoreSnoozedEmail(target.id)
                        : undefined
                    }
                    onToggleBulk={inbox.toggleSelect}
                  />
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
          onStar={(starred) =>
            void inbox.toggleStar(inbox.selectedEmail!.id, starred)
          }
          onSnooze={(hours) =>
            void inbox.snoozeEmailById(inbox.selectedEmail!, hours)
          }
        />
      )}

      {!compact && !showConnectPrompt && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            const target =
              inbox.selectedEmail ??
              inbox.filteredEmails[0] ??
              inbox.emails[0];
            if (target) {
              inbox.openEmailWithAiReply(target);
            }
          }}
          className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3B82F6] text-white shadow-[0_12px_40px_rgba(59,130,246,0.35)] transition-colors hover:bg-[#3B82F6] sm:bottom-8 sm:right-8"
          aria-label="Compose AI reply"
        >
          <PenSquare className="h-5 w-5" strokeWidth={1.75} />
        </motion.button>
      )}
    </>
  );
}

function BulkButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center rounded-lg border border-white/[0.08] bg-[#111111] px-2.5 py-1 text-xs text-[#A1A1AA] transition-colors hover:border-[#3B82F6]/40 hover:text-white"
    >
      {children}
    </button>
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
          ? "bg-[#3B82F6] text-white border border-[#3B82F6]"
          : "bg-[#0A0A0A] border border-white/[0.08] text-[#A1A1AA] hover:border-[#3B82F6]/40 hover:text-white"
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

function ConnectGmailState({
  error,
  errorCode,
  onReconnect,
  reconnecting,
}: {
  error: string | null;
  errorCode: string | null;
  onReconnect: () => void;
  reconnecting: boolean;
}) {
  const needsReconnect = isGmailReconnectRequired(error, errorCode);

  if (needsReconnect) {
    return (
      <PremiumEmptyState
        illustration="inbox"
        title="Gmail session expired"
        description={
          error ??
          "Your Gmail authorization expired. Reconnect to resume syncing and AI inbox features."
        }
        cta={{
          label: reconnecting ? "Reconnecting…" : "Reconnect Gmail",
          onClick: onReconnect,
        }}
        className="border-dashed bg-[#0A0A0A]/50"
      />
    );
  }

  return (
    <PremiumEmptyState
      illustration="inbox"
      title="Connect Gmail to unlock your AI inbox"
      description={
        error ??
        "Link Gmail to pull in messages, get AI summaries on every thread, and draft smart replies without leaving Actora."
      }
      cta={{ label: "Connect Gmail", href: "/dashboard/connect-gmail" }}
      className="border-dashed bg-[#0A0A0A]/50"
    />
  );
}

function ErrorState({
  error,
  errorCode,
  onRetry,
  onReconnect,
  reconnecting,
}: {
  error: string | null;
  errorCode: string | null;
  onRetry: () => void;
  onReconnect: () => void;
  reconnecting: boolean;
}) {
  const needsReconnect = isGmailReconnectRequired(error, errorCode);

  return (
    <div className={`${dashboard.cardBase} border-[#EF4444]/20 p-6`}>
      <p className="text-[#FCA5A5] font-medium mb-2">Could not load Gmail inbox</p>
      <p className={`${dashboard.muted} text-sm mb-4`}>{error}</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRetry}
          disabled={reconnecting}
          className={`${dashboard.btnSecondary} inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60`}
        >
          {reconnecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {reconnecting ? "Reconnecting…" : "Try again"}
        </button>
        {needsReconnect && (
          <button
            type="button"
            onClick={onReconnect}
            disabled={reconnecting}
            className={`${dashboard.btnPrimary} inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60`}
          >
            {reconnecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {reconnecting ? "Opening Google…" : "Reconnect Gmail"}
          </button>
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
  filter: "all" | "unread" | "starred" | "priority" | "snoozed";
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
              : filter === "starred"
                ? "No starred emails"
                : filter === "priority"
                  ? "No priority emails"
                  : filter === "snoozed"
                    ? "No snoozed emails"
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
      secondaryCta={{ label: "Connect Gmail", href: "/dashboard/connect-gmail" }}
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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

