"use client";

import { useGmailAccountsContext } from "@/providers/GmailAccountsProvider";

export function formatGmailSyncTime(lastSyncedAt: string | null): string {
  if (!lastSyncedAt) return "never synced";

  const synced = new Date(lastSyncedAt).getTime();
  if (Number.isNaN(synced)) return "unknown";

  const diffMs = Date.now() - synced;
  if (diffMs < 60_000) return "just now";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function useGmailAccounts() {
  const context = useGmailAccountsContext();
  if (!context) {
    throw new Error("useGmailAccounts must be used within GmailAccountsProvider");
  }
  return context;
}
