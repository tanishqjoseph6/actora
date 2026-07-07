"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { InboxEmail } from "@/lib/gmail";
import { useGmailAccounts } from "@/hooks/useGmailAccounts";

type FetchState = "loading" | "error" | "success";
export type InboxFilter = "all" | "unread" | "starred";

export function useInbox() {
  const { selectedEmail: activeAccountEmail, connected } = useGmailAccounts();
  const [emails, setEmails] = useState<InboxEmail[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [fetchState, setFetchState] = useState<FetchState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<InboxFilter>("all");
  const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(null);
  const [openAiReply, setOpenAiReply] = useState(false);

  const inboxUrl = useMemo(() => {
    if (!activeAccountEmail) return "/api/gmail";
    return `/api/gmail?account=${encodeURIComponent(activeAccountEmail)}`;
  }, [activeAccountEmail]);

  const accountQuery = useMemo(
    () =>
      activeAccountEmail
        ? `?account=${encodeURIComponent(activeAccountEmail)}`
        : "",
    [activeAccountEmail]
  );

  const loadEmails = useCallback(async (silent = false) => {
    if (!connected) {
      setFetchState("error");
      setError("Gmail is not connected. Connect your account to load the inbox.");
      setEmails([]);
      setUnreadCount(0);
      return;
    }

    if (!silent) {
      setFetchState("loading");
    } else {
      setIsRefreshing(true);
    }

    setError(null);

    try {
      const res = await fetch(inboxUrl);
      const data = await res.json();

      if (!res.ok) {
        if (!silent) {
          setFetchState("error");
          setError(data.error ?? "Failed to load emails");
          setEmails([]);
          setUnreadCount(0);
        }
        return;
      }

      setEmails(data.emails ?? []);
      setUnreadCount(data.unreadCount ?? 0);
      setFetchState("success");
    } catch {
      if (!silent) {
        setFetchState("error");
        setError("Failed to load emails. Check your connection and try again.");
        setEmails([]);
        setUnreadCount(0);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [connected, inboxUrl]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadEmails();
    });

    const interval = setInterval(() => {
      void loadEmails(true);
    }, 60_000);

    return () => clearInterval(interval);
  }, [loadEmails, activeAccountEmail]);

  const filteredEmails = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return emails.filter((email) => {
      if (activeFilter === "unread" && !email.unread) return false;
      if (activeFilter === "starred" && !email.starred) return false;

      if (!query) return true;

      return (
        email.sender.toLowerCase().includes(query) ||
        email.subject.toLowerCase().includes(query) ||
        email.preview.toLowerCase().includes(query)
      );
    });
  }, [emails, searchQuery, activeFilter]);

  const starredCount = useMemo(
    () => emails.filter((email) => email.starred).length,
    [emails]
  );

  const markEmailRead = useCallback(async (emailId: string) => {
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
      if (!res.ok) {
        await loadEmails(true);
      }
    } catch {
      await loadEmails(true);
    }
  }, [accountQuery, loadEmails]);

  const archiveEmailById = useCallback(
    async (emailId: string) => {
      setEmails((prev) => prev.filter((email) => email.id !== emailId));
      setSelectedEmail((prev) => (prev?.id === emailId ? null : prev));

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

  return {
    emails,
    unreadCount,
    starredCount,
    fetchState,
    error,
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
    openEmail,
    openEmailWithAiReply,
    closeEmail,
    setOpenAiReply,
    activeAccountEmail,
  };
}
