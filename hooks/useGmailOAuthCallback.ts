"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { fetchJson } from "@/lib/api/fetch-json";
import type { GmailAccountPublic } from "@/lib/gmail/types";

export const GMAIL_OAUTH_CALLBACK_PARAM = "gmail_connected";
export const GMAIL_OAUTH_CALLBACK_URL = `/dashboard?${GMAIL_OAUTH_CALLBACK_PARAM}=1`;

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

export function useGmailOAuthCallback(options?: {
  onSuccess?: (data: GmailConnectResponse) => void | Promise<void>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: sessionStatus, data: session, update: updateSession } =
    useSession();

  const [state, setState] = useState<GmailOAuthCallbackState>({
    connecting: false,
    message: null,
    tone: "success",
    connectedEmail: null,
  });

  const attemptedRef = useRef(false);
  const onSuccessRef = useRef(options?.onSuccess);
  onSuccessRef.current = options?.onSuccess;

  const clearCallbackParam = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete(GMAIL_OAUTH_CALLBACK_PARAM);
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router]);

  const completeGmailConnection = useCallback(async () => {
    setState((prev) => ({ ...prev, connecting: true, message: null }));

    const result = await fetchJson<GmailConnectResponse>("/api/gmail/connect", {
      method: "POST",
    });

    if (!result.ok) {
      setState({
        connecting: false,
        tone: "error",
        message: result.error.message,
        connectedEmail: null,
      });
      return { ok: false as const, error: result.error };
    }

    const { data } = result;

    await onSuccessRef.current?.(data);

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
  }, [clearCallbackParam]);

  useEffect(() => {
    const shouldConnect = searchParams.get(GMAIL_OAUTH_CALLBACK_PARAM) === "1";
    if (!shouldConnect || attemptedRef.current) return;

    if (sessionStatus === "loading") return;

    if (sessionStatus !== "authenticated") {
      attemptedRef.current = true;
      setState({
        connecting: false,
        tone: "error",
        message: "Sign in before connecting Gmail.",
        connectedEmail: null,
      });
      clearCallbackParam();
      return;
    }

    attemptedRef.current = true;

    void (async () => {
      await updateSession();
      await completeGmailConnection();
    })();
  }, [
    searchParams,
    sessionStatus,
    session?.accessToken,
    updateSession,
    completeGmailConnection,
    clearCallbackParam,
  ]);

  return {
    ...state,
    completeGmailConnection,
    clearCallbackParam,
  };
}
