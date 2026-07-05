"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { CurrentPlanBadge } from "@/components/subscription/CurrentPlanBadge";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import {
  formatGmailSyncTime,
  useGmailAccounts,
} from "@/hooks/useGmailAccounts";

function ConnectGmailContent() {
  const searchParams = useSearchParams();
  const { subscription, loading, checkInbox, refreshSubscription } =
    usePlanGate();
  const {
    connected,
    primaryAccount,
    loading: accountsLoading,
    refresh: refreshAccounts,
  } = useGmailAccounts();

  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"success" | "error">("success");

  const completeConnection = useCallback(async () => {
    setIsConnecting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/gmail/connect", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setStatusTone("error");
        setStatusMessage(data.error ?? "Could not connect Gmail.");
        return false;
      }

      await refreshAccounts();
      await refreshSubscription();
      setStatusTone("success");
      setStatusMessage(
        `Gmail connected as ${data.account.email}. Synced ${data.syncedCount} recent emails.`
      );
      return true;
    } catch {
      setStatusTone("error");
      setStatusMessage("Could not connect Gmail. Please try again.");
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [refreshAccounts, refreshSubscription]);

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

    const syncInbox = async () => {
      setIsSyncing(true);
      try {
        await fetch("/api/gmail");
        await refreshAccounts();
      } finally {
        setIsSyncing(false);
      }
    };

    syncInbox();
    const interval = setInterval(syncInbox, 60_000);
    return () => clearInterval(interval);
  }, [connected, accountsLoading, refreshAccounts]);

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
    } catch {
      setStatusTone("error");
      setStatusMessage("Could not connect Gmail. Please try again.");
    } finally {
      setIsConnecting(false);
    }

    await signIn("google", {
      callbackUrl: "/dashboard/connect-gmail?connected=1",
    });
  };

  const showConnected = connected && primaryAccount;

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 lg:mb-8">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full border border-[#1E293B] text-[#3B82F6] text-xs font-medium bg-[#0B1220]">
            📧 Gmail
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
            Connect Gmail
          </h1>
          <p className={`${dashboard.muted} mt-2 text-sm sm:text-base`}>
            Link a Gmail account to sync inbox and automations.
          </p>
        </div>
        <CurrentPlanBadge
          subscription={subscription}
          loading={loading}
          compact
        />
      </div>

      <div className={`${dashboard.cardLg} p-5 sm:p-8 space-y-6`}>
        <p className={`${dashboard.muted} leading-relaxed text-sm sm:text-base`}>
          Link a Gmail account to Actora. Your plan determines how many inboxes
          you can connect.
        </p>

        {subscription && (
          <p className={`text-sm ${dashboard.subtle}`}>
            Inboxes: {subscription.usage.inboxesConnected} /{" "}
            {subscription.limits.inboxes === Infinity
              ? "Unlimited"
              : subscription.limits.inboxes}
          </p>
        )}

        {accountsLoading ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : showConnected ? (
          <div
            className={`rounded-xl border ${dashboard.border} ${dashboard.surface} p-4 sm:p-5`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#2563EB]/15 border border-[#2563EB]/30 flex items-center justify-center text-lg shrink-0">
                  @
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {primaryAccount.email}
                  </p>
                  <p className={`text-xs ${dashboard.subtle} mt-0.5`}>
                    {isSyncing
                      ? "Syncing inbox…"
                      : `Last synced ${formatGmailSyncTime(primaryAccount.lastSyncedAt)} · ${primaryAccount.lastSyncCount} emails`}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 self-start sm:self-center px-3 py-1.5 rounded-full bg-[#2563EB]/15 border border-[#2563EB]/30 text-[#93C5FD] text-xs font-semibold uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                Connected
              </span>
            </div>
          </div>
        ) : null}

        {statusMessage && (
          <p
            className={`text-sm ${
              statusTone === "error" ? "text-[#FCA5A5]" : "text-[#93C5FD]"
            }`}
          >
            {statusMessage}
          </p>
        )}

        {showConnected ? (
          <button
            type="button"
            disabled
            className={`${dashboard.btnPrimary} mt-2 px-5 py-3 text-sm w-full sm:w-auto opacity-70 cursor-default`}
            aria-label="Gmail connected"
          >
            Connected
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            disabled={isConnecting || accountsLoading}
            className={`${dashboard.btnPrimary} mt-2 px-5 py-3 text-sm w-full sm:w-auto disabled:opacity-50`}
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
