"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { InboxEmail } from "@/lib/gmail";

type FetchState = "loading" | "error" | "success";
export type InboxFilter = "all" | "unread" | "starred";

export function useInbox() {
  const [emails, setEmails] = useState<InboxEmail[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [fetchState, setFetchState] = useState<FetchState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<InboxFilter>("all");
  const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(null);
  const [openAiReply, setOpenAiReply] = useState(false);

  const loadEmails = useCallback(async (silent = false) => {
    if (!silent) {
      setFetchState("loading");
    } else {
      setIsRefreshing(true);
    }

    setError(null);

    try {
      const res = await fetch("/api/gmail");
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
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      loadEmails();
    });

    const interval = setInterval(() => {
      loadEmails(true);
    }, 60_000);

    return () => clearInterval(interval);
  }, [loadEmails]);

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
      const res = await fetch(`/api/gmail/${emailId}/read`, { method: "POST" });
      if (!res.ok) {
        await loadEmails(true);
      }
    } catch {
      await loadEmails(true);
    }
  }, [loadEmails]);

  const archiveEmailById = useCallback(
    async (emailId: string) => {
      setEmails((prev) => prev.filter((email) => email.id !== emailId));
      setSelectedEmail((prev) => (prev?.id === emailId ? null : prev));

      try {
        const res = await fetch(`/api/gmail/${emailId}/archive`, {
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
    [loadEmails]
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
  };
}
