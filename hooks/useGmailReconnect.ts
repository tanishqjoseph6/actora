"use client";

import { useCallback, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useGmailAccounts } from "@/hooks/useGmailAccounts";
import {
  CONNECT_IDEMPOTENCY_KEY,
  GMAIL_INBOX_CALLBACK_URL,
} from "@/hooks/useGmailOAuthCallback";
import {
  invalidateCachedData,
  invalidateCachedPrefix,
} from "@/lib/client-data/query-cache";

export function isGmailReconnectRequired(
  error: string | null,
  errorCode: string | null
): boolean {
  if (
    errorCode === "OAUTH_EXPIRED" ||
    errorCode === "OAUTH_DENIED" ||
    errorCode === "GMAIL_NOT_CONNECTED"
  ) {
    return true;
  }

  const lower = error?.toLowerCase() ?? "";
  return (
    lower.includes("reconnect") ||
    lower.includes("expired") ||
    lower.includes("not connected") ||
    lower.includes("not granted")
  );
}

export function clearGmailClientSessionCache(): void {
  invalidateCachedPrefix("inbox:");
  invalidateCachedData("gmail_accounts");
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(CONNECT_IDEMPOTENCY_KEY);
  }
}

export function useGmailReconnect() {
  const { data: session } = useSession();
  const { accounts, selectedEmail } = useGmailAccounts();
  const [reconnecting, setReconnecting] = useState(false);

  const reconnectGmail = useCallback(
    async (email?: string | null) => {
      if (reconnecting) return;

      setReconnecting(true);
      clearGmailClientSessionCache();

      const targetEmail =
        email ?? selectedEmail ?? accounts[0]?.email ?? session?.user?.email ?? null;

      try {
        await signIn(
          "google",
          { callbackUrl: GMAIL_INBOX_CALLBACK_URL },
          {
            prompt: "consent",
            ...(targetEmail ? { login_hint: targetEmail } : {}),
          }
        );
      } catch {
        setReconnecting(false);
        throw new Error("Could not start Gmail reconnect.");
      }
    },
    [accounts, reconnecting, selectedEmail, session?.user?.email]
  );

  return {
    reconnectGmail,
    reconnecting,
    clearGmailClientSessionCache,
  };
}
