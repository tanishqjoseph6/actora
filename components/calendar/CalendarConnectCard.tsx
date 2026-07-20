"use client";

import { motion } from "framer-motion";
import { CalendarDays, RefreshCw } from "lucide-react";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { useCalendarAccount } from "@/hooks/useCalendarAccount";

type CalendarConnectCardProps = {
  compact?: boolean;
};

export function CalendarConnectCard({ compact }: CalendarConnectCardProps) {
  const {
    connected,
    account,
    loading,
    syncing,
    startCalendarOAuth,
    connectWithSession,
    sync,
  } = useCalendarAccount();

  async function handleConnect() {
    try {
      await connectWithSession();
    } catch {
      await startCalendarOAuth();
    }
  }

  if (loading) {
    return (
      <div className={`${dashboard.cardBase} p-4`}>
        <p className={`text-sm ${dashboard.subtle}`}>Checking calendar…</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${dashboard.cardBase} ${dashboard.cardHover} p-4 sm:p-5`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3B82F6]/15 text-[#3B82F6]">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Google Calendar</p>
            <p className={`truncate text-xs ${dashboard.subtle}`}>
              {connected && account
                ? `${account.accountEmail} · synced ${
                    account.lastSyncedAt
                      ? new Date(account.lastSyncedAt).toLocaleString()
                      : "just now"
                  }`
                : "Connect to sync meetings automatically"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              connected
                ? "border-[#3B82F6]/35 bg-[#3B82F6]/15 text-[#93C5FD]"
                : "border-white/[0.06] text-[#71717A]"
            }`}
          >
            {connected ? "Connected" : "Not connected"}
          </span>
          {connected ? (
            <button
              type="button"
              onClick={() => void sync()}
              disabled={syncing}
              className={`${dashboard.btnSecondary} inline-flex items-center gap-1.5 px-3 py-2 text-xs`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing…" : "Sync"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleConnect()}
              className={`${dashboard.btnPrimary} px-3 py-2 text-xs`}
            >
              {compact ? "Connect" : "Enable Calendar"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
