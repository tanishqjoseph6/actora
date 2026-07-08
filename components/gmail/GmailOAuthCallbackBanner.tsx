"use client";

import { Suspense } from "react";
import { useGmailOAuthCallback } from "@/hooks/useGmailOAuthCallback";
import { useGmailAccounts } from "@/hooks/useGmailAccounts";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

function GmailOAuthCallbackBannerInner() {
  const { refresh } = useGmailAccounts();
  const { connecting, message, tone, connectedEmail } = useGmailOAuthCallback({
    onSuccess: async () => {
      await refresh();
    },
  });

  if (connecting) {
    return (
      <p className={`text-sm ${dashboard.accent} mb-4`} role="status">
        Connecting Gmail…
      </p>
    );
  }

  if (!message) return null;

  return (
    <p
      className={`text-sm mb-4 ${
        tone === "error" ? "text-[#FCA5A5]" : "text-[#93C5FD]"
      }`}
      role="status"
    >
      {connectedEmail && tone === "success"
        ? `Gmail connected as ${connectedEmail}.`
        : message}
    </p>
  );
}

export function GmailOAuthCallbackBanner() {
  return (
    <Suspense fallback={null}>
      <GmailOAuthCallbackBannerInner />
    </Suspense>
  );
}
