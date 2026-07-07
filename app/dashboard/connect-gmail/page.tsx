"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { GmailAccountsPanel } from "@/components/gmail/GmailAccountsPanel";
import { CurrentPlanBadge } from "@/components/subscription/CurrentPlanBadge";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { useGmailAccounts } from "@/hooks/useGmailAccounts";
import { formatLimit } from "@/lib/subscription";

function ConnectGmailContent() {
  const searchParams = useSearchParams();
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

  const completeConnection = useCallback(async () => {
    setIsConnecting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/gmail/connect", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setStatusTone("error");
        if (data.code === "PLAN_LIMIT") {
          setStatusMessage(data.error ?? "Inbox limit reached on your current plan.");
        } else if (data.code === "OAUTH_EXPIRED" || data.code === "OAUTH_DENIED") {
          setStatusMessage(
            data.error ??
              "Google authorization failed. Approve Gmail permissions and try again."
          );
        } else {
          setStatusMessage(data.error ?? "Could not connect Gmail.");
        }
        return false;
      }

      await refreshAccounts();
      await refreshSubscription();
      setSelectedEmail(data.account.email);
      setStatusTone("success");
      setStatusMessage(
        data.reconnected
          ? `Reconnected ${data.account.email}. Synced ${data.syncedCount} recent emails.`
          : `Gmail connected as ${data.account.email}. Synced ${data.syncedCount} recent emails.`
      );
      return true;
    } catch {
      setStatusTone("error");
      setStatusMessage("Could not connect Gmail. Please try again.");
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [refreshAccounts, refreshSubscription, setSelectedEmail]);

  useEffect(() => {
    const connectedParam = searchParams.get("connected");
    if (connectedParam !== "1") return;

    queueMicrotask(() => {
      void completeConnection().then((ok) => {
        if (ok) {
          window.history.replaceState({}, "", "/dashboard/connect-gmail");
        }
      });
    });
  }, [searchParams, completeConnection]);

  useEffect(() => {
    if (!connected || accountsLoading) return;

    const syncActiveAccount = async () => {
      if (!selectedEmail) return;
      await syncAccount(selectedEmail);
    };

    void syncActiveAccount();
    const interval = window.setInterval(() => {
      void syncActiveAccount();
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [connected, accountsLoading, selectedEmail, syncAccount]);

  const startGoogleOAuth = useCallback(async (reconnectEmail?: string) => {
    await signIn(
      "google",
      { callbackUrl: "/dashboard/connect-gmail?connected=1" },
      { prompt: reconnectEmail ? "consent" : "select_account consent" }
    );
  }, []);

  const handleConnect = async () => {
    if (!checkInbox()) return;

    setStatusMessage(null);
    setIsConnecting(true);

    try {
      const res = await fetch("/api/gmail/connect", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        await refreshAccounts();
        await refreshSubscription();
        setSelectedEmail(data.account.email);
        setStatusTone("success");
        setStatusMessage(
          `Gmail connected as ${data.account.email}. Synced ${data.syncedCount} recent emails.`
        );
        return;
      }

      setStatusTone("error");
      setStatusMessage(data.error ?? "Could not connect Gmail.");

      if (res.status === 403 && data.code === "PLAN_LIMIT") {
        return;
      }

      if (data.code === "OAUTH_DENIED" || data.code === "OAUTH_EXPIRED") {
        await startGoogleOAuth();
        return;
      }
    } catch {
      setStatusTone("error");
      setStatusMessage("Could not connect Gmail. Please try again.");
    } finally {
      setIsConnecting(false);
    }

    await startGoogleOAuth();
  };

  const handleReconnect = async (email: string) => {
    setStatusMessage(null);
    setIsConnecting(true);

    try {
      const res = await fetch("/api/gmail/connect", { method: "POST" });
      const data = await res.json();

      if (res.ok && data.account.email === email) {
        await refreshAccounts();
        setStatusTone("success");
        setStatusMessage(`Reconnected ${email}. Synced ${data.syncedCount} emails.`);
        return;
      }

      if (res.ok && data.account.email !== email) {
        setStatusTone("error");
        setStatusMessage(
          `Authorized as ${data.account.email}. Sign in with ${email} to reconnect that inbox.`
        );
        return;
      }

      if (data.code === "OAUTH_DENIED" || res.status === 403) {
        await startGoogleOAuth(email);
        return;
      }

      setStatusTone("error");
      setStatusMessage(data.error ?? "Could not reconnect Gmail.");
    } catch {
      setStatusTone("error");
      setStatusMessage("Could not reconnect Gmail. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (email: string) => {
    setStatusMessage(null);
    const result = await disconnectAccount(email);
    await refreshSubscription();

    if (result.ok) {
      setStatusTone("success");
      setStatusMessage(`Disconnected ${email}.`);
      return;
    }

    setStatusTone("error");
    setStatusMessage(result.error ?? "Could not disconnect Gmail account.");
  };

  const handleSync = async (email: string) => {
    setStatusMessage(null);
    const result = await syncAccount(email);

    if (result.ok) {
      const synced = result.data?.results?.find(
        (entry: { email: string }) => entry.email === email
      );
      setStatusTone("success");
      setStatusMessage(
        synced?.error
          ? synced.error
          : `Synced ${synced?.syncedCount ?? 0} emails from ${email}.`
      );
      if (synced?.error) setStatusTone("error");
      return;
    }

    setStatusTone("error");
    setStatusMessage(result.error ?? "Could not sync Gmail inbox.");
  };

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

        {accountsLoading ? (
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

        {(statusMessage || accountsError) && (
          <p
            className={`text-sm ${
              statusTone === "error" || accountsError
                ? "text-[#FCA5A5]"
                : "text-[#93C5FD]"
            }`}
            role="status"
          >
            {statusMessage ?? accountsError}
          </p>
        )}

        {!connected && !accountsLoading && (
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
