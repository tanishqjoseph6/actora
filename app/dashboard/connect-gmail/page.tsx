"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { CurrentPlanBadge } from "@/components/subscription/CurrentPlanBadge";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

function ConnectGmailContent() {
  const searchParams = useSearchParams();
  const { subscription, loading, checkInbox, refreshSubscription } = usePlanGate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const connected = searchParams.get("connected");

    if (connected !== "1") return;

    fetch("/api/subscription/inbox", { method: "POST" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setStatusMessage(data.error ?? "Could not register inbox.");
          return;
        }

        await refreshSubscription();
        setStatusMessage("Gmail account connected successfully.");
        window.history.replaceState({}, "", "/dashboard/connect-gmail");
      })
      .catch(() => {
        setStatusMessage("Could not register inbox. Please try again.");
      });
  }, [searchParams, refreshSubscription]);

  const handleConnect = async () => {
    if (!checkInbox()) return;

    setIsConnecting(true);
    await signIn("google", {
      callbackUrl: "/dashboard/connect-gmail?connected=1",
    });
  };

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

      <div className={`${dashboard.cardLg} p-5 sm:p-8`}>
        <p className={`${dashboard.muted} leading-relaxed text-sm sm:text-base`}>
          Link an additional Gmail account to Actora. Your plan determines how
          many inboxes you can connect.
        </p>

        {subscription && (
          <p className={`mt-4 text-sm ${dashboard.subtle}`}>
            Inboxes: {subscription.usage.inboxesConnected} /{" "}
            {subscription.limits.inboxes === Infinity
              ? "Unlimited"
              : subscription.limits.inboxes}
          </p>
        )}

        {statusMessage && (
          <p className="mt-4 text-sm text-[#93C5FD]">{statusMessage}</p>
        )}

        <button
          type="button"
          onClick={handleConnect}
          disabled={isConnecting}
          className={`${dashboard.btnPrimary} mt-6 px-5 py-3 text-sm w-full sm:w-auto disabled:opacity-50`}
        >
          {isConnecting ? "Redirecting…" : "Connect Google Account"}
        </button>
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
