"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchJson } from "@/lib/api/fetch-json";
import type { GmailAccountPublic } from "@/lib/gmail/types";

const SELECTED_ACCOUNT_KEY = "actora_selected_gmail_account";

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

export function useGmailAccounts() {
  const [accounts, setAccounts] = useState<GmailAccountPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmailState] = useState<string | null>(null);
  const [actionEmail, setActionEmail] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await fetchJson<GmailAccountsResponse>("/api/gmail/accounts");

    if (!result.ok) {
      setAccounts([]);
      setError(result.error.message);
      setLoading(false);
      return;
    }

    const data = result.data;
    const nextAccounts = data.accounts ?? [];
    setAccounts(nextAccounts);

    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem(SELECTED_ACCOUNT_KEY)
        : null;

    const validStored = nextAccounts.find((account) => account.email === stored);
    setSelectedEmailState(validStored?.email ?? nextAccounts[0]?.email ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  const setSelectedEmail = useCallback((email: string | null) => {
    setSelectedEmailState(email);
    if (typeof window === "undefined") return;

    if (email) {
      window.localStorage.setItem(SELECTED_ACCOUNT_KEY, email);
    } else {
      window.localStorage.removeItem(SELECTED_ACCOUNT_KEY);
    }
  }, []);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.email === selectedEmail) ?? accounts[0] ?? null,
    [accounts, selectedEmail]
  );

  const disconnectAccount = useCallback(
    async (email: string) => {
      setActionEmail(email);
      setError(null);

      const result = await fetchJson<GmailActionResponse>("/api/gmail/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!result.ok) {
        setError(result.error.message);
        return {
          ok: false as const,
          error: result.error.message,
          code: result.error.code,
        };
      }

      const nextAccounts = result.data.accounts ?? [];
      setAccounts(nextAccounts);

      if (selectedEmail === email) {
        setSelectedEmail(nextAccounts[0]?.email ?? null);
      }

      setActionEmail(null);
      return { ok: true as const };
    },
    [selectedEmail, setSelectedEmail]
  );

  const syncAccount = useCallback(async (email?: string) => {
    setActionEmail(email ?? "all");
    setError(null);

    const result = await fetchJson<{
      accounts?: GmailAccountPublic[];
      error?: string;
      code?: string;
      results?: Array<{ email: string; syncedCount: number; error?: string }>;
    }>("/api/gmail/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(email ? { email } : {}),
    });

    if (!result.ok && result.error.status !== 207) {
      setError(result.error.message);
      setActionEmail(null);
      return {
        ok: false as const,
        error: result.error.message,
        code: result.error.code,
      };
    }

    const data = result.ok ? result.data : undefined;

    if (data?.accounts) {
      setAccounts(data.accounts);
    } else if (result.ok) {
      await refresh();
    }

    setActionEmail(null);
    return { ok: true as const, data };
  }, [refresh]);

  return {
    accounts,
    connected: accounts.length > 0,
    primaryAccount: accounts[0] ?? null,
    selectedAccount,
    selectedEmail: selectedAccount?.email ?? null,
    loading,
    error,
    actionEmail,
    refresh,
    setSelectedEmail,
    disconnectAccount,
    syncAccount,
  };
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "Not synced yet";

  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export { formatRelativeTime as formatGmailSyncTime };
