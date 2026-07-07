"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

    try {
      const res = await fetch("/api/gmail/accounts");
      const data = (await res.json()) as GmailAccountsResponse;

      if (!res.ok) {
        setAccounts([]);
        setError(data.error ?? "Could not load Gmail accounts.");
        return;
      }

      const nextAccounts = data.accounts ?? [];
      setAccounts(nextAccounts);

      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem(SELECTED_ACCOUNT_KEY)
          : null;

      const validStored = nextAccounts.find((account) => account.email === stored);
      setSelectedEmailState(validStored?.email ?? nextAccounts[0]?.email ?? null);
    } catch {
      setAccounts([]);
      setError("Could not load Gmail accounts.");
    } finally {
      setLoading(false);
    }
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

      try {
        const res = await fetch("/api/gmail/accounts", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = (await res.json()) as GmailActionResponse;

        if (!res.ok) {
          setError(data.error ?? "Could not disconnect Gmail account.");
          return { ok: false as const, error: data.error, code: data.code };
        }

        const nextAccounts = data.accounts ?? [];
        setAccounts(nextAccounts);

        if (selectedEmail === email) {
          setSelectedEmail(nextAccounts[0]?.email ?? null);
        }

        return { ok: true as const };
      } catch {
        const message = "Could not disconnect Gmail account.";
        setError(message);
        return { ok: false as const, error: message };
      } finally {
        setActionEmail(null);
      }
    },
    [selectedEmail, setSelectedEmail]
  );

  const syncAccount = useCallback(async (email?: string) => {
    setActionEmail(email ?? "all");
    setError(null);

    try {
      const res = await fetch("/api/gmail/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(email ? { email } : {}),
      });
      const data = await res.json();

      if (!res.ok && res.status !== 207) {
        setError(data.error ?? "Could not sync Gmail inbox.");
        return { ok: false as const, error: data.error, code: data.code, data };
      }

      if (data.accounts) {
        setAccounts(data.accounts);
      } else {
        await refresh();
      }

      return { ok: true as const, data };
    } catch {
      const message = "Could not sync Gmail inbox.";
      setError(message);
      return { ok: false as const, error: message };
    } finally {
      setActionEmail(null);
    }
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
