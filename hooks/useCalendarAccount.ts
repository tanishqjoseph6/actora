"use client";

import { useCallback, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { fetchJson } from "@/lib/api/fetch-json";
import {
  CALENDAR_OAUTH_CALLBACK_URL,
  GOOGLE_CALENDAR_CONNECT_SCOPE,
  GOOGLE_PRODUCT_OAUTH_PARAMS,
} from "@/lib/calendar/scopes";
import type { CalendarAccountPublic } from "@/lib/calendar/types";

type StatusResponse = {
  connected: boolean;
  account: CalendarAccountPublic | null;
  accounts: CalendarAccountPublic[];
};

export function useCalendarAccount() {
  const [account, setAccount] = useState<CalendarAccountPublic | null>(null);
  const [accounts, setAccounts] = useState<CalendarAccountPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchJson<StatusResponse>("/api/calendar/status");
    if (!result.ok) {
      setError(result.error.message);
      setAccount(null);
      setAccounts([]);
      setLoading(false);
      return;
    }
    setAccount(result.data.account);
    setAccounts(result.data.accounts ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const startCalendarOAuth = useCallback(async () => {
    await signIn(
      "google",
      { callbackUrl: CALENDAR_OAUTH_CALLBACK_URL },
      {
        scope: GOOGLE_CALENDAR_CONNECT_SCOPE,
        ...GOOGLE_PRODUCT_OAUTH_PARAMS,
      }
    );
  }, []);

  const connectWithSession = useCallback(async () => {
    setError(null);
    const result = await fetchJson<{
      account: CalendarAccountPublic;
      accounts: CalendarAccountPublic[];
      code?: string;
    }>("/api/calendar/connect", { method: "POST" });

    if (!result.ok) {
      setError(result.error.message);
      throw new Error(result.error.message);
    }

    setAccount(result.data.account);
    setAccounts(result.data.accounts ?? []);
    return result.data;
  }, []);

  const sync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    const result = await fetchJson<{
      syncedCount: number;
      account: CalendarAccountPublic | null;
    }>("/api/calendar/sync", { method: "POST" });
    setSyncing(false);

    if (!result.ok) {
      setError(result.error.message);
      throw new Error(result.error.message);
    }

    if (result.data.account) setAccount(result.data.account);
    return result.data.syncedCount;
  }, []);

  const disconnect = useCallback(async () => {
    const result = await fetchJson("/api/calendar/disconnect?provider=google", {
      method: "DELETE",
    });
    if (!result.ok) {
      throw new Error(result.error.message);
    }
    setAccount(null);
    setAccounts([]);
  }, []);

  return {
    account,
    accounts,
    connected: Boolean(account),
    loading,
    syncing,
    error,
    refresh,
    startCalendarOAuth,
    connectWithSession,
    sync,
    disconnect,
  };
}
