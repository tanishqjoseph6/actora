"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { GmailAccountsPanel } from "@/components/gmail/GmailAccountsPanel";
import { CurrentPlanBadge } from "@/components/subscription/CurrentPlanBadge";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { useGmailAccounts } from "@/hooks/useGmailAccounts";
import { fetchJson } from "@/lib/api/fetch-json";
import {
  GMAIL_OAUTH_CALLBACK_URL,
  useGmailOAuthCallback,
} from "@/hooks/useGmailOAuthCallback";
import { formatLimit } from "@/lib/subscription";

function ConnectGmailContent() {
  const { subscription, loading, checkInbox, refreshSubscription } =
    usePlanGate();
  const {
    accounts,
    connected,
    selectedEmail,
    actionEmail,
    loading: accountsLoading,
    error: accountsError,
    refresh: refreshAccounts,
    setSelectedEmail,
    disconnectAccount,
    syncAccount,
  } = useGmailAccounts();

  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"success" | "error">("success");

  const oauthCallback = useGmailOAuthCallback({
    onSuccess: async (data) => {
      await refreshAccounts();
      await refreshSubscription();
      setSelectedEmail(data.account.email);
      setStatusTone("success");
      setStatusMessage(
        data.reconnected
          ? `Reconnected ${data.account.email}. Inbox sync started.`
          : `Gmail connected as ${data.account.email}. Inbox sync started.`
      );
    },
  });

  const inboxLimit = useMemo(() => {
    if (!subscription) return 1;
    return subscription.limits.inboxes === Infinity
      ? ("unlimited" as const)
      : subscription.limits.inboxes;
  }, [subscription]);

  const canAddAccount = useMemo(() => {
    if (!subscription) return false;
    if (inboxLimit === "unlimited") return true;
    return accounts.length < inboxLimit;
  }, [accounts.length, inboxLimit, subscription]);

  const startGoogleOAuth = useCallback(async (reconnectEmail?: string) => {
    console.log("[connect-gmail] starting Google OAuth", {
      callbackUrl: GMAIL_OAUTH_CALLBACK_URL,
      reconnectEmail: reconnectEmail ?? null,
    });
    await signIn(
      "google",
      { callbackUrl: GMAIL_OAUTH_CALLBACK_URL },
      {
        prompt: reconnectEmail ? "consent" : "select_account consent",
        ...(reconnectEmail ? { login_hint: reconnectEmail } : {}),
      }
    );
  }, []);

  const connectWithSession = useCallback(async () => {
    setIsConnecting(true);
    setStatusMessage(null);

    const result = await fetchJson<{
      account: { email: string };
      reconnected?: boolean;
      syncedCount: number;
      syncWarning?: string;
      code?: string;
      error?: string;
    }>("/api/gmail/connect", { method: "POST" });

    setIsConnecting(false);

    if (!result.ok) {
      setStatusTone("error");
      setStatusMessage(result.error.message);
      return { ok: false as const, code: result.error.code, status: result.error.status };
    }

    // Fire-and-forget inbox sync after account is saved.
    void fetchJson("/api/gmail/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: result.data.account.email }),
    });

    await refreshAccounts();
    await refreshSubscription();
    setSelectedEmail(result.data.account.email);
    setStatusTone("success");
    setStatusMessage(
      result.data.reconnected
        ? `Reconnected ${result.data.account.email}. Inbox sync started.`
        : `Gmail connected as ${result.data.account.email}. Inbox sync started.`
    );
    return { ok: true as const, data: result.data };
  }, [refreshAccounts, refreshSubscription, setSelectedEmail]);

  const handleConnect = async () => {
    if (!checkInbox()) return;

    setStatusMessage(null);
    const result = await connectWithSession();

    if (result.ok) return;

    if (result.code === "PLAN_LIMIT") return;

    if (result.code === "OAUTH_DENIED" || result.code === "OAUTH_EXPIRED") {
      await startGoogleOAuth();
      return;
    }

    if (result.status === 403 || result.status === 401) {
      await startGoogleOAuth();
    }
  };

  const handleReconnect = async (email: string) => {
    setStatusMessage(null);
    setIsConnecting(true);

    const result = await fetchJson<{
      account: { email: string };
      syncedCount: number;
      code?: string;
      error?: string;
    }>("/api/gmail/connect", { method: "POST" });

    setIsConnecting(false);

    if (result.ok) {
      if (result.data.account.email === email) {
        await refreshAccounts();
        setStatusTone("success");
        setStatusMessage(`Reconnected ${email}. Synced ${result.data.syncedCount} emails.`);
        return;
      }

      setStatusTone("error");
      setStatusMessage(
        `Authorized as ${result.data.account.email}. Sign in with ${email} to reconnect that inbox.`
      );
      return;
    }

    if (result.error.code === "OAUTH_DENIED" || result.error.status === 403) {
      await startGoogleOAuth(email);
      return;
    }

    setStatusTone("error");
    setStatusMessage(result.error.message);
  };

  const handleDisconnect = async (email: string) => {
    setStatusMessage(null);
    const ok = await disconnectAccount(email);
    await refreshSubscription();

    if (ok) {
      setStatusTone("success");
      setStatusMessage(`Disconnected ${email}.`);
      return;
    }

    setStatusTone("error");
    setStatusMessage(accountsError ?? "Could not disconnect Gmail account.");
  };

  const handleSync = async (email: string) => {
    setStatusMessage(null);
    const ok = await syncAccount(email);

    if (ok) {
      setStatusTone("success");
      setStatusMessage(`Synced inbox for ${email}.`);
      return;
    }

    setStatusTone("error");
    setStatusMessage(accountsError ?? "Could not sync Gmail inbox.");
  };

  const displayMessage =
    statusMessage ?? oauthCallback.message ?? accountsError;
  const displayTone =
    statusTone === "error" || accountsError || oauthCallback.tone === "error"
      ? "error"
      : "success";

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 lg:mb-8">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full border border-[#1E293B] text-[#3B82F6] text-xs font-medium bg-[#0B1220]">
            Gmail
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
            Gmail accounts
          </h1>
          <p className={`${dashboard.muted} mt-2 text-sm sm:text-base`}>
            Connect, sync, and manage multiple Gmail inboxes in one workspace.
          </p>
        </div>
        <CurrentPlanBadge
          subscription={subscription}
          loading={loading}
          compact
        />
      </div>

      <div className={`${dashboard.cardLg} p-5 sm:p-8 space-y-6`}>
        {subscription && (
          <p className={`text-sm ${dashboard.subtle}`}>
            Inboxes: {subscription.usage.inboxesConnected} /{" "}
            {formatLimit(subscription.limits.inboxes)}
          </p>
        )}

        {accountsLoading || oauthCallback.connecting ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : (
          <GmailAccountsPanel
            accounts={accounts}
            selectedEmail={selectedEmail}
            actionEmail={actionEmail ?? (isConnecting ? "all" : null)}
            inboxLimit={inboxLimit}
            canAddAccount={canAddAccount}
            onSelect={setSelectedEmail}
            onConnect={() => void handleConnect()}
            onReconnect={(email) => void handleReconnect(email)}
            onDisconnect={(email) => void handleDisconnect(email)}
            onSync={(email) => void handleSync(email)}
          />
        )}

        {displayMessage && (
          <p
            className={`text-sm ${
              displayTone === "error" ? "text-[#FCA5A5]" : "text-[#93C5FD]"
            }`}
            role="status"
          >
            {displayMessage}
          </p>
        )}

        {!connected && !accountsLoading && !oauthCallback.connecting && (
          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={isConnecting || accountsLoading}
            className={`${dashboard.btnPrimary} px-5 py-3 text-sm w-full sm:w-auto disabled:opacity-50`}
          >
            {isConnecting ? "Connecting…" : "Connect Google Account"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ConnectGmailPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto w-full space-y-4" aria-busy="true" aria-label="Loading">
          <Skeleton className="h-10 w-48" />
          <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-6 space-y-4">
            <Skeleton className="h-6 w-64 max-w-full" />
            <SkeletonText lines={3} />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      }
    >
      <ConnectGmailContent />
    </Suspense>
  );
}
