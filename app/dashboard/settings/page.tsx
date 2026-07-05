"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { getAvatarGradient, getInitials } from "@/lib/avatar";
import {
  CurrentPlanBadge,
  formatRenewalDate,
  PlanUsageDisplay,
} from "@/components/subscription/CurrentPlanBadge";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import {
  SettingsDivider,
  SettingsField,
  SettingsInput,
  SettingsSection,
  SettingsSelect,
  SettingsToggle,
} from "@/components/settings/SettingsSection";
import { SettingsHeader, SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { useGmailAccounts } from "@/hooks/useGmailAccounts";
import { formatLimit } from "@/lib/subscription";
import { REPLY_TONE_LABELS, REPLY_TONES } from "@/lib/openai";

export default function SettingsPage() {
  const { subscription, loading } = usePlanGate();
  const { data: session } = useSession();
  const { connected: gmailConnected, primaryAccount } = useGmailAccounts();

  const displayName = session?.user?.name ?? "";
  const email = primaryAccount?.email ?? session?.user?.email ?? "";

  const [name, setName] = useState("");
  const [dailyDigest, setDailyDigest] = useState(true);
  const [dealUpdates, setDealUpdates] = useState(true);
  const [taskReminders, setTaskReminders] = useState(false);
  const [productUpdates, setProductUpdates] = useState(false);
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [defaultTone, setDefaultTone] = useState("professional");
  const [activeSection, setActiveSection] = useState("profile");

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash) setActiveSection(hash);
    };
    queueMicrotask(syncFromHash);
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  useEffect(() => {
    const ids = ["profile", "notifications", "integrations", "preferences", "billing", "account"];
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5] }
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <SettingsHeader />
        <CurrentPlanBadge
          subscription={subscription}
          loading={loading}
          compact
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)] gap-6 lg:gap-8">
        <SettingsSidebar activeId={activeSection} />

        <div className="space-y-6 min-w-0">
          {/* Profile */}
          <SettingsSection
            id="profile"
            title="Profile"
            description="Your personal information visible across Actora."
            footer={
              <button
                type="button"
                disabled
                className={`${dashboard.btnPrimary} px-4 py-2 text-sm opacity-60 cursor-not-allowed`}
                title="Coming soon"
              >
                Save changes
              </button>
            }
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getAvatarGradient(displayName || email)} flex items-center justify-center text-lg font-bold text-white shrink-0`}
              >
                {getInitials(displayName || email || "?")}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {displayName || "Your profile"}
                </p>
                <p className={`text-xs ${dashboard.subtle}`}>{email}</p>
              </div>
            </div>

            <SettingsDivider />

            <div className="grid sm:grid-cols-2 gap-5">
              <SettingsField label="Display name" htmlFor="display-name" hint="Shown in comments and activity.">
                <SettingsInput
                  id="display-name"
                  value={name || displayName}
                  onChange={setName}
                  placeholder="Your name"
                />
              </SettingsField>
              <SettingsField label="Email" htmlFor="email" hint="Managed by your Google account.">
                <SettingsInput
                  id="email"
                  type="email"
                  value={email}
                  readOnly
                />
              </SettingsField>
            </div>
          </SettingsSection>

          {/* Notifications */}
          <SettingsSection
            id="notifications"
            title="Notifications"
            description="Choose what updates you receive by email."
          >
            <SettingsToggle
              id="daily-digest"
              label="Daily inbox digest"
              description="Summary of unread emails and AI suggestions each morning."
              checked={dailyDigest}
              onChange={setDailyDigest}
            />
            <SettingsDivider />
            <SettingsToggle
              id="deal-updates"
              label="Deal stage changes"
              description="Alerts when deals move in your CRM pipeline."
              checked={dealUpdates}
              onChange={setDealUpdates}
            />
            <SettingsDivider />
            <SettingsToggle
              id="task-reminders"
              label="Task due reminders"
              description="Reminders for tasks due today or overdue."
              checked={taskReminders}
              onChange={setTaskReminders}
            />
            <SettingsDivider />
            <SettingsToggle
              id="product-updates"
              label="Product updates"
              description="New features, tips, and changelog announcements."
              checked={productUpdates}
              onChange={setProductUpdates}
            />
          </SettingsSection>

          {/* Integrations */}
          <SettingsSection
            id="integrations"
            title="Integrations"
            description="Connected accounts and third-party services."
          >
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[#1E293B] bg-[#0B1220]`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0">
                  <GoogleIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">Google Gmail</p>
                  <p className={`text-xs ${dashboard.subtle} truncate`}>
                    {gmailConnected && email
                      ? `Connected as ${email}`
                      : "Sync inbox, send replies, and run automations"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border ${
                    gmailConnected
                      ? "bg-[#2563EB]/15 border-[#2563EB]/35 text-[#93C5FD]"
                      : "bg-[#0B1220] border-[#1E293B] text-[#64748B]"
                  }`}
                >
                  {gmailConnected ? "Connected" : "Not connected"}
                </span>
                <Link
                  href="/dashboard/connect-gmail"
                  className={`${dashboard.btnSecondary} px-3 py-2 text-xs`}
                >
                  {gmailConnected ? "Manage" : "Connect"}
                </Link>
              </div>
            </div>

            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[#1E293B] bg-[#0B1220] opacity-60`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#111827] border border-[#1E293B] flex items-center justify-center text-lg shrink-0">
                  📅
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Google Calendar</p>
                  <p className={`text-xs ${dashboard.subtle}`}>Sync meetings and schedule follow-ups</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border border-[#1E293B] text-[#64748B]">
                Coming soon
              </span>
            </div>
          </SettingsSection>

          <SettingsSection
            id="team"
            title="Team"
            description="Collaboration features for your organization."
          >
            <FeatureGate feature="team_workspace" compact>
              <div className={`p-4 rounded-xl border ${dashboard.border} ${dashboard.surface}`}>
                <p className="text-sm font-medium text-white">Team workspace</p>
                <p className={`text-xs ${dashboard.subtle} mt-1`}>
                  Invite members, assign roles, and manage your org from one workspace.
                </p>
              </div>
            </FeatureGate>

            <div className="mt-4">
              <FeatureGate feature="shared_inbox" compact>
                <div className={`p-4 rounded-xl border ${dashboard.border} ${dashboard.surface}`}>
                  <p className="text-sm font-medium text-white">Shared inbox</p>
                  <p className={`text-xs ${dashboard.subtle} mt-1`}>
                    Your team can collaborate on email threads in a unified inbox.
                  </p>
                </div>
              </FeatureGate>
            </div>
          </SettingsSection>

          {/* Preferences */}
          <SettingsSection
            id="preferences"
            title="Preferences"
            description="Workspace defaults and regional settings."
            footer={
              <button
                type="button"
                disabled
                className={`${dashboard.btnPrimary} px-4 py-2 text-sm opacity-60 cursor-not-allowed`}
                title="Coming soon"
              >
                Save preferences
              </button>
            }
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <SettingsField label="Timezone" htmlFor="timezone">
                <SettingsSelect
                  id="timezone"
                  value={timezone}
                  onChange={setTimezone}
                  options={[
                    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
                    { value: "America/Denver", label: "Mountain Time (MT)" },
                    { value: "America/Chicago", label: "Central Time (CT)" },
                    { value: "America/New_York", label: "Eastern Time (ET)" },
                    { value: "Europe/London", label: "London (GMT)" },
                    { value: "Asia/Kolkata", label: "India (IST)" },
                  ]}
                />
              </SettingsField>
              <SettingsField label="Default AI reply tone" htmlFor="default-tone">
                <SettingsSelect
                  id="default-tone"
                  value={defaultTone}
                  onChange={setDefaultTone}
                  options={REPLY_TONES.map((tone) => ({
                    value: tone,
                    label: REPLY_TONE_LABELS[tone],
                  }))}
                />
              </SettingsField>
            </div>
          </SettingsSection>

          {/* Billing */}
          <SettingsSection
            id="billing"
            title="Billing & subscription"
            description="Your plan, usage limits, and renewal details."
          >
            <div className="mb-2">
              <CurrentPlanBadge subscription={subscription} loading={loading} />
              {subscription && (
                <p className={`text-sm ${dashboard.muted} mt-2`}>
                  Renews on{" "}
                  <span className="text-white">
                    {formatRenewalDate(subscription.currentPeriodEnd)}
                  </span>
                  {" · "}
                  {subscription.billingInterval === "yearly" ? "Yearly" : "Monthly"}{" "}
                  billing
                </p>
              )}
            </div>

            <PlanUsageDisplay subscription={subscription} loading={loading} />

            {subscription && (
              <div className="grid sm:grid-cols-2 gap-3 mt-2">
                <div className="rounded-xl border border-[#1E293B] bg-[#0B1220] p-4">
                  <p className={`text-xs ${dashboard.subtle}`}>AI actions limit</p>
                  <p className="text-sm font-semibold text-white mt-1 tabular-nums">
                    {formatLimit(subscription.limits.aiActionsPerMonth)}/month
                  </p>
                </div>
                <div className="rounded-xl border border-[#1E293B] bg-[#0B1220] p-4">
                  <p className={`text-xs ${dashboard.subtle}`}>Inbox limit</p>
                  <p className="text-sm font-semibold text-white mt-1 tabular-nums">
                    {formatLimit(subscription.limits.inboxes)}
                  </p>
                </div>
              </div>
            )}

            <Link
              href="/billing"
              className={`${dashboard.btnPrimary} inline-flex mt-2 px-4 py-2.5 text-sm`}
            >
              Manage billing
            </Link>
          </SettingsSection>

          {/* Account */}
          <SettingsSection
            id="account"
            title="Account"
            description="Session and account actions."
          >
            <div className={`rounded-xl border border-[#1E293B] bg-[#0B1220] p-4 ${dashboard.muted} text-sm`}>
              Signed in as{" "}
              <span className="text-white font-medium">{email || "—"}</span>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className={`${dashboard.btnSecondary} px-4 py-2.5 text-sm text-[#94A3B8] hover:text-white`}
            >
              Sign out
            </button>
          </SettingsSection>
        </div>
      </div>
    </>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
