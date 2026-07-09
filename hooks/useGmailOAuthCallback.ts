"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, useSession } from "next-auth/react";
import { fetchJson } from "@/lib/api/fetch-json";
import type { GmailAccountPublic } from "@/lib/gmail/types";

export const GMAIL_OAUTH_CALLBACK_PARAM = "gmail_connected";
export const GMAIL_OAUTH_CALLBACK_URL = `/dashboard/connect-gmail?${GMAIL_OAUTH_CALLBACK_PARAM}=1`;

const CONNECT_IDEMPOTENCY_KEY = "actora_gmail_connect_attempt";
const MAX_CONNECT_RETRIES = 4;
const RETRY_DELAY_MS = 1200;

type GmailConnectResponse = {
  account: GmailAccountPublic;
  isNew: boolean;
  reconnected: boolean;
  syncedCount: number;
  syncWarning?: string;
  accounts: GmailAccountPublic[];
  code?: string;
  error?: string;
};

type GmailOAuthCallbackState = {
  connecting: boolean;
  message: string | null;
  tone: "success" | "error";
  connectedEmail: string | null;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useGmailOAuthCallback(options?: {
  onSuccess?: (data: GmailConnectResponse) => void | Promise<void>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: sessionStatus, update: updateSession } = useSession();

  const [state, setState] = useState<GmailOAuthCallbackState>({
    connecting: false,
    message: null,
    tone: "success",
    connectedEmail: null,
  });

  const onSuccessRef = useRef(options?.onSuccess);
  onSuccessRef.current = options?.onSuccess;

  const clearCallbackParam = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete(GMAIL_OAUTH_CALLBACK_PARAM);
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router]);

  const waitForSessionTokens = useCallback(async (): Promise<boolean> => {
    for (let attempt = 0; attempt < MAX_CONNECT_RETRIES; attempt += 1) {
      await updateSession();
      const session = await getSession();
      if (session?.accessToken || session?.user?.email) {
        return true;
      }
      await sleep(RETRY_DELAY_MS);
    }
    return false;
  }, [updateSession]);

  const completeGmailConnection = useCallback(async () => {
    setState((prev) => ({ ...prev, connecting: true, message: null }));

    let lastError: string | null = null;

    for (let attempt = 0; attempt < MAX_CONNECT_RETRIES; attempt += 1) {
      const result = await fetchJson<GmailConnectResponse>("/api/gmail/connect", {
        method: "POST",
      });

      if (result.ok) {
        const { data } = result;
        await onSuccessRef.current?.(data);

        if (typeof window !== "undefined") {
          sessionStorage.removeItem(CONNECT_IDEMPOTENCY_KEY);
        }

        setState({
          connecting: false,
          tone: data.syncWarning ? "error" : "success",
          message: data.syncWarning
            ? data.syncWarning
            : data.reconnected
              ? `Gmail reconnected as ${data.account.email}.`
              : `Gmail connected as ${data.account.email}.`,
          connectedEmail: data.account.email,
        });

        clearCallbackParam();
        return { ok: true as const, data };
      }

      lastError = result.error.message;

      if (
        result.error.code === "OAUTH_DENIED" &&
        attempt < MAX_CONNECT_RETRIES - 1
      ) {
        await waitForSessionTokens();
        await sleep(RETRY_DELAY_MS);
        continue;
      }

      break;
    }

    setState({
      connecting: false,
      tone: "error",
      message: lastError ?? "Could not connect Gmail.",
      connectedEmail: null,
    });

    clearCallbackParam();
    return {
      ok: false as const,
      error: { message: lastError ?? "Could not connect Gmail." },
    };
  }, [clearCallbackParam, waitForSessionTokens]);

  useEffect(() => {
    const shouldConnect = searchParams.get(GMAIL_OAUTH_CALLBACK_PARAM) === "1";
    if (!shouldConnect) return;

    if (typeof window !== "undefined") {
      const prior = sessionStorage.getItem(CONNECT_IDEMPOTENCY_KEY);
      if (prior === "done") {
        clearCallbackParam();
        return;
      }
      sessionStorage.setItem(CONNECT_IDEMPOTENCY_KEY, "pending");
    }

    if (sessionStatus === "loading") return;

    if (sessionStatus !== "authenticated") {
      setState({
        connecting: false,
        tone: "error",
        message: "Sign in before connecting Gmail.",
        connectedEmail: null,
      });
      clearCallbackParam();
      return;
    }

    void (async () => {
      const ready = await waitForSessionTokens();
      if (!ready) {
        setState({
          connecting: false,
          tone: "error",
          message: "Session not ready. Please try connecting Gmail again.",
          connectedEmail: null,
        });
        clearCallbackParam();
        return;
      }

      const result = await completeGmailConnection();
      if (result.ok && typeof window !== "undefined") {
        sessionStorage.setItem(CONNECT_IDEMPOTENCY_KEY, "done");
      }
    })();
  }, [
    searchParams,
    sessionStatus,
    waitForSessionTokens,
    completeGmailConnection,
    clearCallbackParam,
  ]);

  return {
    ...state,
    completeGmailConnection,
    clearCallbackParam,
  };
}
