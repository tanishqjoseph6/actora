"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { CurrentPlanBadge } from "@/components/subscription/CurrentPlanBadge";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";

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
    <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1 mb-4 rounded-full border border-[rgba(37, 99, 235,0.25)] text-[#3B82F6] text-sm font-medium bg-[#0B1220]/60 backdrop-blur-sm">
            📧 Gmail
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold">
            Connect <span className="text-blue-400">Gmail</span>
          </h1>
        </div>
        <CurrentPlanBadge
          subscription={subscription}
          loading={loading}
          compact
        />
      </div>

      <div className="rounded-2xl bg-[#0B1220]/80 backdrop-blur-sm border border-[rgba(37, 99, 235,0.15)] p-6 sm:p-8 shadow-lg shadow-black/20">
        <p className="text-gray-400 leading-relaxed">
          Link an additional Gmail account to Actora. Your plan determines how
          many inboxes you can connect.
        </p>

        {subscription && (
          <p className="mt-4 text-sm text-gray-500">
            Inboxes: {subscription.usage.inboxesConnected} /{" "}
            {subscription.limits.inboxes === Infinity
              ? "Unlimited"
              : subscription.limits.inboxes}
          </p>
        )}

        {statusMessage && (
          <p className="mt-4 text-sm text-emerald-400">{statusMessage}</p>
        )}

        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="mt-6 px-5 py-3 rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-sm font-semibold hover:bg-[#1D4ED8] transition-all duration-300 shadow-md shadow-blue-500/20 disabled:opacity-50"
        >
          {isConnecting ? "Redirecting…" : "Connect Google Account"}
        </button>
      </div>
    </div>
  );
}

export default function ConnectGmailPage() {
  return (
    <main className="min-h-screen bg-[#050816] text-white overflow-hidden">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-blue-500/8 blur-[180px] rounded-full pointer-events-none" />
      <Suspense
        fallback={
          <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-8 py-12 sm:py-16 animate-pulse">
            <div className="h-10 w-48 bg-blue-400/10 rounded mb-6" />
            <div className="h-40 bg-[#0B1220]/80 rounded-2xl" />
          </div>
        }
      >
        <ConnectGmailContent />
      </Suspense>
    </main>
  );
}
