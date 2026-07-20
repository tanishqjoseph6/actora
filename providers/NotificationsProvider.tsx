"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { fetchJson } from "@/lib/api/fetch-json";
import type { UserNotification } from "@/lib/notifications/types";
import {
  getCachedData,
  invalidateCachedData,
  setCachedData,
} from "@/lib/client-data/query-cache";

const CACHE_KEY = "user_notifications";
const CACHE_TTL_MS = 30_000;
const POLL_MS = 30_000;

type NotificationsResponse = {
  notifications: UserNotification[];
  unreadCount: number;
};

export type NotificationsContextValue = {
  items: UserNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markUnread: (id: string) => Promise<void>;
  toggleRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearAll: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [items, setItems] = useState<UserNotification[]>(() => {
    const cached = getCachedData<NotificationsResponse>(CACHE_KEY, CACHE_TTL_MS);
    return cached?.notifications ?? [];
  });
  const [unreadCount, setUnreadCount] = useState(() => {
    const cached = getCachedData<NotificationsResponse>(CACHE_KEY, CACHE_TTL_MS);
    return cached?.unreadCount ?? 0;
  });
  const [loading, setLoading] = useState(() => {
    const cached = getCachedData<NotificationsResponse>(CACHE_KEY, CACHE_TTL_MS);
    return !cached;
  });
  const [error, setError] = useState<string | null>(null);

  const applyResponse = useCallback((data: NotificationsResponse) => {
    setItems(data.notifications ?? []);
    setUnreadCount(data.unreadCount ?? 0);
    setCachedData(CACHE_KEY, data);
  }, []);

  const refresh = useCallback(async () => {
    const cached = getCachedData<NotificationsResponse>(CACHE_KEY, CACHE_TTL_MS);
    if (!cached) setLoading(true);
    setError(null);

    const result = await fetchJson<NotificationsResponse>("/api/notifications");
    setLoading(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    applyResponse(result.data);
  }, [applyResponse]);

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }

    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, POLL_MS);

    return () => window.clearInterval(timer);
  }, [status, refresh]);

  const markRead = useCallback(
    async (id: string) => {
      const result = await fetchJson<NotificationsResponse>("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: true }),
      });
      if (result.ok) applyResponse(result.data);
    },
    [applyResponse]
  );

  const markUnread = useCallback(
    async (id: string) => {
      const result = await fetchJson<NotificationsResponse>("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: false }),
      });
      if (result.ok) applyResponse(result.data);
    },
    [applyResponse]
  );

  const toggleRead = useCallback(
    async (id: string) => {
      const current = items.find((item) => item.id === id);
      if (!current) return;
      if (current.read) await markUnread(id);
      else await markRead(id);
    },
    [items, markRead, markUnread]
  );

  const markAllRead = useCallback(async () => {
    const result = await fetchJson<NotificationsResponse>("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    if (result.ok) applyResponse(result.data);
  }, [applyResponse]);

  const clearAll = useCallback(async () => {
    const result = await fetchJson<NotificationsResponse>("/api/notifications", {
      method: "DELETE",
    });
    if (result.ok) {
      invalidateCachedData(CACHE_KEY);
      applyResponse(result.data);
    }
  }, [applyResponse]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      items,
      unreadCount,
      loading,
      error,
      refresh,
      markRead,
      markUnread,
      toggleRead,
      markAllRead,
      clearAll,
    }),
    [
      items,
      unreadCount,
      loading,
      error,
      refresh,
      markRead,
      markUnread,
      toggleRead,
      markAllRead,
      clearAll,
    ]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationsProvider"
    );
  }
  return context;
}
