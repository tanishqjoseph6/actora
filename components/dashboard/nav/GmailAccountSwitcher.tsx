"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Check, ChevronsUpDown, Link2, Mail, Unplug } from "lucide-react";
import {
  formatGmailSyncTime,
  useGmailAccounts,
} from "@/hooks/useGmailAccounts";
import { useDismissible } from "@/hooks/useDismissible";
import { DropdownShell } from "./DropdownShell";
import { cn } from "@/lib/utils";

export function GmailAccountSwitcher() {
  const [open, setOpen] = useState(false);
  const {
    accounts,
    connected,
    selectedAccount,
    loading,
    actionEmail,
    setSelectedEmail,
    disconnectAccount,
  } = useGmailAccounts();

  const close = useCallback(() => setOpen(false), []);
  const ref = useDismissible(open, close);

  const label = selectedAccount?.email ?? (loading ? "Loading…" : "Connect Gmail");
  const initial = (selectedAccount?.email ?? "G").charAt(0).toUpperCase();

  return (
    <div className="relative hidden sm:block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex max-w-[220px] items-center gap-2 rounded-xl border border-white/[0.08] bg-[#111111] px-3 py-2 text-xs font-medium text-[#A1A1AA] transition-colors hover:border-[#3B82F6]/30 hover:text-white"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#3B82F6]/15 text-[11px] font-semibold text-[#93C5FD]">
          {connected ? initial : <Mail className="h-3.5 w-3.5" />}
        </span>
        <span className="truncate capitalize">
          {connected ? label.split("@")[0] : "Gmail"}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-[#71717A]" />
      </button>

      <DropdownShell open={open} widthClassName="w-[340px]">
        <div className="border-b border-white/[0.06] px-4 py-3">
          <p className="text-sm font-medium text-white">Gmail accounts</p>
          <p className="mt-0.5 text-xs text-[#71717A]">
            Switch the active inbox for Actora
          </p>
        </div>

        <div className="max-h-[280px] space-y-1 overflow-y-auto p-2">
          {loading && (
            <p className="px-3 py-4 text-sm text-[#71717A]">Loading accounts…</p>
          )}

          {!loading && accounts.length === 0 && (
            <div className="px-3 py-6 text-center">
              <Mail className="mx-auto h-5 w-5 text-[#52525B]" />
              <p className="mt-2 text-sm text-[#A1A1AA]">No Gmail connected</p>
              <p className="mt-1 text-xs text-[#71717A]">
                Connect an account to sync your inbox.
              </p>
            </div>
          )}

          {accounts.map((account) => {
            const active = account.email === selectedAccount?.email;
            const busy = actionEmail === account.email;
            return (
              <div
                key={account.id}
                className={cn(
                  "rounded-xl border px-3 py-2.5 transition-colors",
                  active
                    ? "border-[#3B82F6]/35 bg-[#3B82F6]/10"
                    : "border-transparent hover:bg-white/[0.03]"
                )}
              >
                <button
                  type="button"
                  className="flex w-full items-start gap-3 text-left"
                  onClick={() => {
                    setSelectedEmail(account.email);
                    close();
                  }}
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/15 text-xs font-semibold text-[#93C5FD]">
                    {account.email.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-white">
                        {account.email}
                      </span>
                      {active && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-[#3B82F6]" />
                      )}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-[#71717A]">
                      Connected · {formatGmailSyncTime(account.lastSyncedAt)}
                    </span>
                  </span>
                </button>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void disconnectAccount(account.email)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-[#A1A1AA] transition-colors hover:bg-white/[0.04] hover:text-red-300 disabled:opacity-50"
                  >
                    <Unplug className="h-3 w-3" />
                    {busy ? "Disconnecting…" : "Disconnect"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-white/[0.06] p-2">
          <Link
            href="/dashboard/connect-gmail"
            onClick={close}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[#A1A1AA] transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            <Link2 className="h-4 w-4 text-[#3B82F6]" />
            Connect another Gmail
          </Link>
        </div>
      </DropdownShell>
    </div>
  );
}
