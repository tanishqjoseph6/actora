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
import type { GmailAccountPublic } from "@/lib/gmail/types";
import {
  getCachedData,
  invalidateCachedData,
  fetchCached,
} from "@/lib/client-data/query-cache";

const SELECTED_ACCOUNT_KEY = "actora_selected_gmail_account";
const CACHE_KEY = "gmail_accounts";
const CACHE_TTL_MS = 5 * 60_000;

type GmailAccountsResponse = {
  accounts: GmailAccountPublic[];
  connected: boolean;
  error?: string;
};

type GmailActionResponse = {
  error?: string;
  code?: string;
  accounts?: GmailAccountPublic[];
};

export type GmailAccountsContextValue = {
  accounts: GmailAccountPublic[];
  connected: boolean;
  primaryAccount: GmailAccountPublic | null;
  selectedEmail: string | null;
  actionEmail: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setSelectedEmail: (email: string) => void;
  disconnectAccount: (email: string) => Promise<boolean>;
  syncAccount: (email?: string) => Promise<boolean>;
};

const GmailAccountsContext = createContext<GmailAccountsContextValue | null>(
  null
);

export function GmailAccountsProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [accounts, setAccounts] = useState<GmailAccountPublic[]>(() => {
    const cached = getCachedData<GmailAccountsResponse>(CACHE_KEY, CACHE_TTL_MS);
    return cached?.accounts ?? [];
  });
  const [loading, setLoading] = useState(() => {
    const cached = getCachedData<GmailAccountsResponse>(CACHE_KEY, CACHE_TTL_MS);
    return !cached;
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmailState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(SELECTED_ACCOUNT_KEY);
  });
  const [actionEmail, setActionEmail] = useState<string | null>(null);

  const setSelectedEmail = useCallback((email: string) => {
    setSelectedEmailState(email);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SELECTED_ACCOUNT_KEY, email);
    }
  }, []);

  const refresh = useCallback(async (force = false) => {
    const cached = getCachedData<GmailAccountsResponse>(CACHE_KEY, CACHE_TTL_MS);
    if (cached && !force) {
      setAccounts(cached.accounts ?? []);
      setLoading(false);
    } else if (!cached) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await fetchCached(
        CACHE_KEY,
        async () => {
          const result = await fetchJson<GmailAccountsResponse>(
            "/api/gmail/accounts"
          );
          if (!result.ok) {
            throw new Error(result.error.message);
          }
          return result.data;
        },
        { ttlMs: CACHE_TTL_MS, force: force || Boolean(cached) }
      );

      const nextAccounts = data.accounts ?? [];
      setAccounts(nextAccounts);

      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem(SELECTED_ACCOUNT_KEY)
          : null;

      const validStored = nextAccounts.find((account) => account.email === stored);
      if (validStored) {
        setSelectedEmailState(validStored.email);
      } else if (nextAccounts[0]) {
        setSelectedEmail(nextAccounts[0].email);
      } else {
        setSelectedEmailState(null);
      }
    } catch (err) {
      setAccounts([]);
      setError(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, [setSelectedEmail]);

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }
    void refresh(false);
  }, [status, refresh]);

  const disconnectAccount = useCallback(
    async (email: string) => {
      setActionEmail(email);
      const result = await fetchJson<GmailActionResponse>("/api/gmail/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setActionEmail(null);

      if (!result.ok) {
        setError(result.error.message);
        return false;
      }

      invalidateCachedData(CACHE_KEY);
      await refresh(true);
      return true;
    },
    [refresh]
  );

  const syncAccount = useCallback(
    async (email?: string) => {
      setActionEmail(email ?? selectedEmail ?? accounts[0]?.email ?? null);
      const result = await fetchJson<{
        accounts?: GmailAccountPublic[];
        error?: string;
      }>("/api/gmail/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: email ?? selectedEmail }),
      });
      setActionEmail(null);

      if (!result.ok) {
        setError(result.error.message);
        return false;
      }

      invalidateCachedData(CACHE_KEY);
      await refresh(true);
      return true;
    },
    [accounts, refresh, selectedEmail]
  );

  const primaryAccount = useMemo(
    () =>
      accounts.find((a) => a.email === selectedEmail) ?? accounts[0] ?? null,
    [accounts, selectedEmail]
  );

  const refreshAccounts = useCallback(() => refresh(true), [refresh]);

  const value = useMemo<GmailAccountsContextValue>(
    () => ({
      accounts,
      connected: accounts.length > 0,
      primaryAccount,
      selectedEmail,
      actionEmail,
      loading,
      error,
      refresh: refreshAccounts,
      setSelectedEmail,
      disconnectAccount,
      syncAccount,
    }),
    [
      accounts,
      primaryAccount,
      selectedEmail,
      actionEmail,
      loading,
      error,
      refreshAccounts,
      setSelectedEmail,
      disconnectAccount,
      syncAccount,
    ]
  );

  return (
    <GmailAccountsContext.Provider value={value}>
      {children}
    </GmailAccountsContext.Provider>
  );
}

export function useGmailAccountsContext(): GmailAccountsContextValue | null {
  return useContext(GmailAccountsContext);
}
