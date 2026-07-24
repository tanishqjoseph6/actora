"use client";

import { signIn } from "next-auth/react";
import { Mail } from "lucide-react";
import { CompactEmptyState } from "@/components/ui/CompactEmptyState";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { formatGmailSyncTime } from "@/hooks/useGmailAccounts";
import { GMAIL_OAUTH_CALLBACK_URL } from "@/hooks/useGmailOAuthCallback";
import {
  GOOGLE_GMAIL_CONNECT_SCOPE,
  GOOGLE_PRODUCT_OAUTH_PARAMS,
} from "@/lib/calendar/scopes";
import type { GmailAccountPublic } from "@/lib/gmail/types";

type GmailAccountsPanelProps = {
  accounts: GmailAccountPublic[];
  selectedEmail: string | null;
  actionEmail: string | null;
  inboxLimit: number | "unlimited";
  canAddAccount: boolean;
  onSelect: (email: string) => void;
  onConnect: () => void;
  onReconnect: (email: string) => void;
  onDisconnect: (email: string) => void;
  onSync: (email: string) => void;
};

export function GmailAccountsPanel({
  accounts,
  selectedEmail,
  actionEmail,
  inboxLimit,
  canAddAccount,
  onSelect,
  onConnect,
  onReconnect,
  onDisconnect,
  onSync,
}: GmailAccountsPanelProps) {
  if (accounts.length === 0) {
    return (
      <CompactEmptyState
        icon={Mail}
        title="No Gmail connected"
        description="Connect your inbox to sync messages, AI summaries, and smart replies."
        cta={{ label: "Connect Gmail", onClick: onConnect }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => {
        const isSelected = account.email === selectedEmail;
        const isBusy = actionEmail === account.email || actionEmail === "all";

        return (
          <div
            key={account.id}
            className={`rounded-xl border p-4 sm:p-5 transition-colors ${
              isSelected
                ? "border-[#2563EB]/50 bg-[#2563EB]/5"
                : `${dashboard.border} ${dashboard.surface}`
            }`}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => onSelect(account.email)}
                  className="flex items-start gap-3 flex-1 min-w-0 text-left"
                  aria-pressed={isSelected}
                >
                  <div className="w-11 h-11 rounded-xl bg-[#2563EB]/15 border border-[#2563EB]/30 flex items-center justify-center text-sm font-bold text-[#93C5FD] shrink-0">
                    {account.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {account.email}
                    </p>
                    <p className={`text-xs ${dashboard.subtle} mt-0.5`}>
                      Last synced {formatGmailSyncTime(account.lastSyncedAt)} ·{" "}
                      {account.lastSyncCount} emails
                    </p>
                  </div>
                </button>

                <span
                  className={`inline-flex items-center gap-2 shrink-0 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${
                    isSelected
                      ? "bg-[#2563EB]/15 border-[#2563EB]/30 text-[#93C5FD]"
                      : "bg-[#0B1220] border-[#1E293B] text-[#64748B]"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? "bg-[#2563EB]" : "bg-[#64748B]"
                    }`}
                  />
                  {isSelected ? "Active" : "Connected"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onSync(account.email)}
                  disabled={isBusy}
                  className={`${dashboard.btnSecondary} px-3 py-2 text-xs disabled:opacity-50`}
                >
                  {isBusy ? "Syncing…" : "Sync now"}
                </button>
                <button
                  type="button"
                  onClick={() => onReconnect(account.email)}
                  disabled={isBusy}
                  className={`${dashboard.btnSecondary} px-3 py-2 text-xs disabled:opacity-50`}
                >
                  Reconnect
                </button>
                <button
                  type="button"
                  onClick={() => onDisconnect(account.email)}
                  disabled={isBusy}
                  className="px-3 py-2 text-xs rounded-xl border border-[#1E293B] text-[#FCA5A5] hover:border-rose-400/30 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <p className={`text-xs ${dashboard.subtle}`}>
          {accounts.length} of{" "}
          {inboxLimit === "unlimited" ? "unlimited" : inboxLimit} inbox
          {inboxLimit === 1 ? "" : "es"} connected
        </p>
        {canAddAccount ? (
          <button
            type="button"
            onClick={() =>
              void signIn(
                "google",
                { callbackUrl: GMAIL_OAUTH_CALLBACK_URL },
                {
                  scope: GOOGLE_GMAIL_CONNECT_SCOPE,
                  ...GOOGLE_PRODUCT_OAUTH_PARAMS,
                  prompt: "select_account consent",
                }
              )
            }
            className={`${dashboard.btnSecondary} px-4 py-2.5 text-sm`}
          >
            Add another account
          </button>
        ) : (
          <p className={`text-xs ${dashboard.subtle}`}>
            Upgrade your plan to connect more inboxes.
          </p>
        )}
      </div>
    </div>
  );
}
