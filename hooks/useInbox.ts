"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { InboxEmail } from "@/lib/gmail/message-types";
import { sortByPriority } from "@/lib/gmail/priority";
import {
  listReadySnoozes,
  listSnoozedEmails,
  snoozeEmail,
  unsnoozeEmail,
  type SnoozeEntry,
} from "@/lib/email/snooze-store";
import { useGmailAccounts } from "@/hooks/useGmailAccounts";
import { fetchCached, invalidateCachedPrefix } from "@/lib/client-data/query-cache";

type FetchState = "loading" | "error" | "success";
export type InboxFilter = "all" | "unread" | "starred" | "priority" | "snoozed";

type InboxPayload = {
  emails: InboxEmail[];
  unreadCount: number;
};

const INBOX_TTL_MS = 45_000;

export function useInbox() {
  const { selectedEmail: activeAccountEmail, connected } = useGmailAccounts();
  const [emails, setEmails] = useState<InboxEmail[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [fetchState, setFetchState] = useState<FetchState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<InboxFilter>("all");
  const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(null);
  const [openAiReply, setOpenAiReply] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [snoozedEntries, setSnoozedEntries] = useState<SnoozeEntry[]>([]);
  const [listFocusIndex, setListFocusIndex] = useState(0);

  const accountQuery = useMemo(
    () =>
      activeAccountEmail
        ? `?account=${encodeURIComponent(activeAccountEmail)}`
        : "",
    [activeAccountEmail]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const refreshSnoozed = useCallback(() => {
    setSnoozedEntries(listSnoozedEmails(activeAccountEmail));
  }, [activeAccountEmail]);

  useEffect(() => {
    refreshSnoozed();
    const timer = window.setInterval(refreshSnoozed, 30_000);
    return () => window.clearInterval(timer);
  }, [refreshSnoozed]);

  const loadEmails = useCallback(
    async (silent = false, force = false) => {
      if (!connected) {
        setFetchState("error");
        setError("Gmail is not connected. Connect your account to load the inbox.");
        setErrorCode("GMAIL_NOT_CONNECTED");
        setEmails([]);
        setUnreadCount(0);
        return;
      }

      if (activeFilter === "snoozed") {
        refreshSnoozed();
        setFetchState("success");
        setError(null);
        setErrorCode(null);
        setEmails([]);
        setUnreadCount(0);
        return;
      }

      if (!silent) setFetchState("loading");
      else setIsRefreshing(true);

      setError(null);
      setErrorCode(null);

      if (force) {
        invalidateCachedPrefix(`inbox:${activeAccountEmail ?? "default"}`);
      }

      const params = new URLSearchParams();
      if (activeAccountEmail) params.set("account", activeAccountEmail);
      if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
      if (
        activeFilter === "unread" ||
        activeFilter === "starred" ||
        activeFilter === "priority"
      ) {
        params.set("filter", activeFilter);
      }
      const fetchUrl = `/api/gmail?${params.toString()}`;
      const cacheKey = `inbox:${activeAccountEmail ?? "default"}:${activeFilter}:${debouncedSearch.trim()}`;

      try {
        const data = await fetchCached(
          cacheKey,
          async () => {
            const res = await fetch(fetchUrl);
            const body = (await res.json()) as {
              error?: string;
              code?: string;
              emails?: InboxEmail[];
              unreadCount?: number;
            };
            if (!res.ok) {
              const message = body.error ?? "Failed to load emails";
              const err = new Error(message) as Error & { code?: string };
              err.code = body.code;
              throw err;
            }
            return {
              emails: (body.emails ?? []) as InboxEmail[],
              unreadCount: body.unreadCount ?? 0,
            } satisfies InboxPayload;
          },
          {
            ttlMs: INBOX_TTL_MS,
            force: force || silent || Boolean(debouncedSearch.trim()),
          }
        );

        let nextEmails = data.emails;
        const snoozedIds = new Set(
          listSnoozedEmails(activeAccountEmail).map((e) => e.emailId)
        );
        nextEmails = nextEmails.filter((email) => !snoozedIds.has(email.id));

        if (activeFilter === "priority") {
          nextEmails = sortByPriority(nextEmails);
        }

        setEmails(nextEmails);
        setUnreadCount(data.unreadCount);
        setFetchState("success");
        setErrorCode(null);
      } catch (err) {
        const code =
          err instanceof Error
            ? (err as Error & { code?: string }).code ?? null
            : null;
        if (!silent) {
          setFetchState("error");
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load emails. Check your connection and try again."
          );
          setErrorCode(code);
          setEmails([]);
          setUnreadCount(0);
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    [activeAccountEmail, activeFilter, connected, debouncedSearch, refreshSnoozed]
  );

  useEffect(() => {
    queueMicrotask(() => {
      void loadEmails();
    });

    const interval = setInterval(() => {
      void loadEmails(true);
    }, 60_000);

    return () => clearInterval(interval);
  }, [loadEmails]);

  const filteredEmails = useMemo(() => {
    if (activeFilter === "snoozed") {
      return snoozedEntries.map((entry) => entry.email);
    }

    const query = searchQuery.trim().toLowerCase();
    let list = emails;

    if (query && !debouncedSearch) {
      list = list.filter(
        (email) =>
          email.sender.toLowerCase().includes(query) ||
          email.subject.toLowerCase().includes(query) ||
          email.preview.toLowerCase().includes(query)
      );
    }

    if (activeFilter === "unread") list = list.filter((e) => e.unread);
    if (activeFilter === "starred") list = list.filter((e) => e.starred);
    if (activeFilter === "priority") {
      list = list.filter(
        (e) => e.priority === "high" || e.priority === "medium"
      );
    }

    return list;
  }, [activeFilter, debouncedSearch, emails, searchQuery, snoozedEntries]);

  useEffect(() => {
    setListFocusIndex((idx) =>
      filteredEmails.length === 0 ? 0 : Math.min(idx, filteredEmails.length - 1)
    );
  }, [filteredEmails.length]);

  const starredCount = useMemo(
    () => emails.filter((email) => email.starred).length,
    [emails]
  );

  const priorityCount = useMemo(
    () =>
      emails.filter((e) => e.priority === "high" || e.priority === "medium")
        .length,
    [emails]
  );

  const markEmailRead = useCallback(
    async (emailId: string) => {
      setEmails((prev) =>
        prev.map((email) =>
          email.id === emailId ? { ...email, unread: false } : email
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setSelectedEmail((prev) =>
        prev?.id === emailId ? { ...prev, unread: false } : prev
      );

      try {
        const res = await fetch(`/api/gmail/${emailId}/read${accountQuery}`, {
          method: "POST",
        });
        if (!res.ok) await loadEmails(true);
      } catch {
        await loadEmails(true);
      }
    },
    [accountQuery, loadEmails]
  );

  const archiveEmailById = useCallback(
    async (emailId: string) => {
      setEmails((prev) => prev.filter((email) => email.id !== emailId));
      setSelectedEmail((prev) => (prev?.id === emailId ? null : prev));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(emailId);
        return next;
      });

      try {
        const res = await fetch(`/api/gmail/${emailId}/archive${accountQuery}`, {
          method: "POST",
        });

        if (!res.ok) {
          await loadEmails(true);
          return false;
        }

        await loadEmails(true);
        return true;
      } catch {
        await loadEmails(true);
        return false;
      }
    },
    [accountQuery, loadEmails]
  );

  const toggleStar = useCallback(
    async (emailId: string, starred: boolean) => {
      setEmails((prev) =>
        prev.map((email) =>
          email.id === emailId ? { ...email, starred } : email
        )
      );
      setSelectedEmail((prev) =>
        prev?.id === emailId ? { ...prev, starred } : prev
      );

      try {
        const res = await fetch(`/api/gmail/${emailId}/star${accountQuery}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ starred }),
        });
        if (!res.ok) await loadEmails(true);
      } catch {
        await loadEmails(true);
      }
    },
    [accountQuery, loadEmails]
  );

  const snoozeEmailById = useCallback(
    async (email: InboxEmail, hours: number) => {
      const wakeAt = new Date(Date.now() + hours * 60 * 60 * 1000);
      snoozeEmail(email, wakeAt, activeAccountEmail);
      refreshSnoozed();
      await archiveEmailById(email.id);
    },
    [activeAccountEmail, archiveEmailById, refreshSnoozed]
  );

  const restoreSnoozedEmail = useCallback(
    async (emailId: string) => {
      try {
        const res = await fetch(
          `/api/gmail/${emailId}/restore${accountQuery}`,
          { method: "POST" }
        );
        if (res.ok) {
          unsnoozeEmail(emailId);
          refreshSnoozed();
          await loadEmails(true);
          return true;
        }
      } catch {
        // fall through
      }
      return false;
    },
    [accountQuery, loadEmails, refreshSnoozed]
  );

  const runBulkAction = useCallback(
    async (action: "archive" | "read" | "star" | "unstar") => {
      const ids = Array.from(selectedIds);
      if (!ids.length) return;

      const res = await fetch(`/api/gmail/bulk${accountQuery}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action }),
      });

      if (res.ok) {
        setSelectedIds(new Set());
        setBulkMode(false);
        if (action === "archive") {
          setSelectedEmail(null);
        }
        await loadEmails(true);
      }
    },
    [accountQuery, loadEmails, selectedIds]
  );

  const toggleSelect = useCallback((emailId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(emailId)) next.delete(emailId);
      else next.add(emailId);
      return next;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedIds(new Set(filteredEmails.map((e) => e.id)));
  }, [filteredEmails]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setBulkMode(false);
  }, []);

  const openEmail = useCallback((email: InboxEmail) => {
    setSelectedEmail(email);
    setOpenAiReply(false);
  }, []);

  const openEmailWithAiReply = useCallback((email: InboxEmail) => {
    setSelectedEmail(email);
    setOpenAiReply(true);
  }, []);

  const closeEmail = useCallback(() => {
    setSelectedEmail(null);
    setOpenAiReply(false);
  }, []);

  const focusEmailAt = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, filteredEmails.length - 1));
      setListFocusIndex(clamped);
      return filteredEmails[clamped] ?? null;
    },
    [filteredEmails]
  );

  return {
    emails,
    unreadCount,
    starredCount,
    priorityCount,
    snoozedCount: snoozedEntries.length,
    readySnoozes: listReadySnoozes(activeAccountEmail),
    fetchState,
    error,
    errorCode,
    isRefreshing,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filteredEmails,
    selectedEmail,
    openAiReply,
    loadEmails,
    markEmailRead,
    archiveEmailById,
    toggleStar,
    snoozeEmailById,
    restoreSnoozedEmail,
    openEmail,
    openEmailWithAiReply,
    closeEmail,
    setOpenAiReply,
    activeAccountEmail,
    bulkMode,
    setBulkMode,
    selectedIds,
    toggleSelect,
    selectAllVisible,
    clearSelection,
    runBulkAction,
    listFocusIndex,
    setListFocusIndex,
    focusEmailAt,
  };
}
