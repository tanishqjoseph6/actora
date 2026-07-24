"use client";

import { useCallback, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { PrefetchLink } from "@/components/dashboard/PrefetchLink";
import { Skeleton, SkeletonListRows } from "@/components/ui/Skeleton";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import {
  Check,
  ChevronsUpDown,
  Link2,
  Mail,
  RefreshCw,
  Unplug,
} from "lucide-react";
import {
  formatGmailSyncTime,
  useGmailAccounts,
} from "@/hooks/useGmailAccounts";
import {
  GMAIL_OAUTH_CALLBACK_URL,
} from "@/hooks/useGmailOAuthCallback";
import {
  GOOGLE_GMAIL_CONNECT_SCOPE,
  GOOGLE_PRODUCT_OAUTH_PARAMS,
} from "@/lib/calendar/scopes";
import { useDismissible } from "@/hooks/useDismissible";
import { formatLimit } from "@/lib/subscription";
import { DropdownShell } from "./DropdownShell";
import { cn } from "@/lib/utils";

export function GmailAccountSwitcher() {
  const [open, setOpen] = useState(false);
  const { subscription, checkInbox } = usePlanGate();
  const {
    accounts,
    connected,
    primaryAccount,
    loading,
    actionEmail,
    setSelectedEmail,
    disconnectAccount,
    syncAccount,
  } = useGmailAccounts();

  const close = useCallback(() => setOpen(false), []);
  const ref = useDismissible(open, close);

  const label = primaryAccount?.email ?? "Connect Gmail";
  const initial = (primaryAccount?.email ?? "G").charAt(0).toUpperCase();

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

  const limitLabel = useMemo(() => {
    if (inboxLimit === "unlimited") return `${accounts.length} connected`;
    return `${accounts.length} of ${formatLimit(inboxLimit)} accounts`;
  }, [accounts.length, inboxLimit]);

  const handleConnectAnother = useCallback(async () => {
    close();
    if (!canAddAccount) {
      checkInbox();
      return;
    }
    await signIn(
      "google",
      { callbackUrl: GMAIL_OAUTH_CALLBACK_URL },
      {
        scope: GOOGLE_GMAIL_CONNECT_SCOPE,
        ...GOOGLE_PRODUCT_OAUTH_PARAMS,
        prompt: "select_account consent",
      }
    );
  }, [canAddAccount, checkInbox, close]);

  const handleDisconnect = useCallback(
    async (email: string, isActive: boolean) => {
      if (isActive) return;
      await disconnectAccount(email);
    },
    [disconnectAccount]
  );

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
          {loading && !primaryAccount ? (
            <Skeleton className="inline-block h-3 w-16 align-middle" />
          ) : connected ? (
            label.split("@")[0]
          ) : (
            "Gmail"
          )}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-[#71717A]" />
      </button>

      <DropdownShell open={open} widthClassName="w-[340px]">
        <div className="border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">Gmail accounts</p>
              <p className="mt-0.5 text-xs text-[#71717A]">
                Switch the active inbox for Actora
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                connected
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-white/[0.08] text-[#71717A]"
              )}
            >
              {connected ? "Connected" : "Not connected"}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#52525B]">{limitLabel}</p>
        </div>

        <div className="max-h-[280px] space-y-1 overflow-y-auto p-2">
          {loading && (
            <SkeletonListRows rows={2} className="px-2 py-2" />
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
            const active = account.email === primaryAccount?.email;
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
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-white">
                        {account.email}
                      </span>
                      {active && (
                        <>
                          <span className="rounded-full border border-[#3B82F6]/35 bg-[#3B82F6]/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#93C5FD]">
                            Primary
                          </span>
                          <Check className="h-3.5 w-3.5 shrink-0 text-[#3B82F6]" />
                        </>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-[#71717A]">
                      Connected · Last sync {formatGmailSyncTime(account.lastSyncedAt)}
                    </span>
                  </span>
                </button>
                <div className="mt-2 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void syncAccount(account.email)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-[#A1A1AA] transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
                  >
                    <RefreshCw
                      className={cn("h-3 w-3", busy && "animate-spin")}
                    />
                    {busy ? "Syncing…" : "Sync"}
                  </button>
                  <button
                    type="button"
                    disabled={busy || active}
                    title={
                      active
                        ? "Switch to another account before disconnecting"
                        : "Disconnect account"
                    }
                    onClick={() => void handleDisconnect(account.email, active)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-[#A1A1AA] transition-colors hover:bg-white/[0.04] hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Unplug className="h-3 w-3" />
                    Disconnect
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-white/[0.06] p-2">
          {canAddAccount ? (
            <button
              type="button"
              onClick={() => void handleConnectAnother()}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[#A1A1AA] transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              <Link2 className="h-4 w-4 text-[#3B82F6]" />
              Add another Gmail account
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                close();
                checkInbox();
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[#71717A] transition-colors hover:bg-white/[0.04] hover:text-[#A1A1AA]"
            >
              <Link2 className="h-4 w-4 text-[#52525B]" />
              Account limit reached
            </button>
          )}
          {!connected && (
            <PrefetchLink
              href="/dashboard/connect-gmail"
              onClick={close}
              className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[#A1A1AA] transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              <Mail className="h-4 w-4 text-[#3B82F6]" />
              Connect Gmail
            </PrefetchLink>
          )}
        </div>
      </DropdownShell>
    </div>
  );
}
