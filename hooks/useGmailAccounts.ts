"use client";

import { useCallback, useEffect, useState } from "react";
import type { GmailAccountPublic } from "@/lib/gmail/types";

type GmailAccountsResponse = {
  accounts: GmailAccountPublic[];
  connected: boolean;
};

export function useGmailAccounts() {
  const [accounts, setAccounts] = useState<GmailAccountPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/gmail/accounts");
      const data = (await res.json()) as GmailAccountsResponse & {
        error?: string;
      };

      if (!res.ok) {
        setAccounts([]);
        setError(data.error ?? "Could not load Gmail accounts.");
        return;
      }

      setAccounts(data.accounts ?? []);
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

  return {
    accounts,
    connected: accounts.length > 0,
    primaryAccount: accounts[0] ?? null,
    loading,
    error,
    refresh,
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
