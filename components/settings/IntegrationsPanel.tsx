"use client";

import Link from "next/link";
import { useState } from "react";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { useGmailAccounts } from "@/hooks/useGmailAccounts";
import { useCalendarAccount } from "@/hooks/useCalendarAccount";
import { useCalendarOAuthCallback } from "@/hooks/useCalendarOAuthCallback";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.9 2.4 2.7 6.6 2.7 11.7S6.9 21 12 21c5.2 0 8.6-3.6 8.6-8.7 0-.6-.1-1-.2-1.5H12z"
      />
    </svg>
  );
}

function formatSync(iso: string | null | undefined): string {
  if (!iso) return "Never synced";
  return `Last sync ${new Date(iso).toLocaleString()}`;
}

export function IntegrationsPanel() {
  const {
    connected: gmailConnected,
    primaryAccount,
  } = useGmailAccounts();
  const {
    connected: calendarConnected,
    account: calendarAccount,
    syncing,
    startCalendarOAuth,
    connectWithSession,
    sync,
    disconnect,
    refresh,
  } = useCalendarAccount();

  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [bannerTone, setBannerTone] = useState<"success" | "error">("success");

  const oauth = useCalendarOAuthCallback({
    onSuccess: async () => {
      await refresh();
      setBannerTone("success");
      setBanner("Google Calendar connected and syncing.");
    },
  });

  async function handleCalendarConnect() {
    setBusy(true);
    setBanner(null);
    try {
      await connectWithSession();
      setBannerTone("success");
      setBanner("Google Calendar connected.");
      await sync().catch(() => undefined);
    } catch {
      await startCalendarOAuth();
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    setBusy(true);
    try {
      await disconnect();
      setBannerTone("success");
      setBanner("Google Calendar disconnected.");
    } catch {
      setBannerTone("error");
      setBanner("Could not disconnect Calendar.");
    } finally {
      setBusy(false);
    }
  }

  const gmailEmail = primaryAccount?.email;
  const calendarEmail = calendarAccount?.accountEmail;

  return (
    <div className="space-y-3">
      {(banner || oauth.message || oauth.connecting) && (
        <div
          className={`rounded-xl border px-3 py-2 text-xs ${
            (bannerTone === "error" || oauth.tone === "error") && !oauth.connecting
              ? "border-red-400/30 bg-red-500/10 text-red-200"
              : "border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#93C5FD]"
          }`}
        >
          {oauth.connecting
            ? "Finishing Google Calendar connection…"
            : banner ?? oauth.message}
        </div>
      )}

      <IntegrationRow
        icon={<GoogleIcon className="h-5 w-5" />}
        iconClassName="bg-white"
        title="Google Gmail"
        subtitle={
          gmailConnected && gmailEmail
            ? `Connected as ${gmailEmail}`
            : "Sync inbox, send replies, and run automations"
        }
        connected={gmailConnected}
        meta={
          gmailConnected
            ? formatSync(primaryAccount?.lastSyncedAt)
            : undefined
        }
        action={
          <Link
            href="/dashboard/connect-gmail"
            className={`${dashboard.btnSecondary} px-3 py-2 text-xs`}
          >
            {gmailConnected ? "Manage" : "Connect"}
          </Link>
        }
      />

      <IntegrationRow
        icon={<span className="text-base">📅</span>}
        title="Google Calendar"
        subtitle={
          calendarConnected && calendarEmail
            ? `Connected as ${calendarEmail}`
            : gmailConnected
              ? "One-click enable using your Google account"
              : "Sync meetings and schedule follow-ups"
        }
        connected={calendarConnected}
        meta={
          calendarConnected
            ? formatSync(calendarAccount?.lastSyncedAt)
            : undefined
        }
        action={
          calendarConnected ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={syncing || busy}
                onClick={() => void sync()}
                className={`${dashboard.btnSecondary} px-3 py-2 text-xs`}
              >
                {syncing ? "Syncing…" : "Sync"}
              </button>
              <Link
                href="/dashboard/calendar"
                className={`${dashboard.btnSecondary} px-3 py-2 text-xs`}
              >
                Manage
              </Link>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleDisconnect()}
                className="rounded-xl border border-white/[0.08] px-3 py-2 text-xs text-[#A1A1AA] hover:text-white"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleCalendarConnect()}
              className={`${dashboard.btnPrimary} px-3 py-2 text-xs`}
            >
              {busy ? "Connecting…" : gmailConnected ? "Enable Calendar" : "Connect"}
            </button>
          )
        }
      />

      <IntegrationRow
        icon={<span className="text-base">🎥</span>}
        title="Google Meet"
        subtitle="Add Meet links when creating events from Actora"
        connected={false}
        comingSoon
      />
    </div>
  );
}

function IntegrationRow({
  icon,
  iconClassName,
  title,
  subtitle,
  connected,
  meta,
  action,
  comingSoon,
}: {
  icon: React.ReactNode;
  iconClassName?: string;
  title: string;
  subtitle: string;
  connected: boolean;
  meta?: string;
  action?: React.ReactNode;
  comingSoon?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-[18px] border p-4 sm:flex-row sm:items-center sm:justify-between ${dashboard.border} ${dashboard.surface} ${
        comingSoon ? "opacity-70" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] ${
            iconClassName ?? dashboard.surface
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{title}</p>
          <p className={`truncate text-xs ${dashboard.subtle}`}>{subtitle}</p>
          {meta && <p className={`mt-0.5 text-[11px] ${dashboard.subtle}`}>{meta}</p>}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <span
          className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            comingSoon
              ? `${dashboard.border} ${dashboard.subtle}`
              : connected
                ? "border-[#3B82F6]/35 bg-[#3B82F6]/15 text-[#93C5FD]"
                : "border-white/[0.06] bg-[#0A0A0A] text-[#71717A]"
          }`}
        >
          {comingSoon ? "Coming soon" : connected ? "Connected" : "Not connected"}
        </span>
        {action}
      </div>
    </div>
  );
}
