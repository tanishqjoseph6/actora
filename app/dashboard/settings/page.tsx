"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { getAvatarGradient, getInitials } from "@/lib/avatar";
import {
  CurrentPlanBadge,
  formatRenewalDate,
  PlanUsageDisplay,
} from "@/components/subscription/CurrentPlanBadge";
import {
  AiCreditsCard,
  AiCreditWarningBanner,
} from "@/components/subscription/AiCreditsCard";
import { AiCreditUsageHistory } from "@/components/subscription/AiCreditUsageHistory";
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
import { IntegrationsPanel } from "@/components/settings/IntegrationsPanel";
import {
  ComingSoonBadge,
  useBillingPause,
} from "@/components/billing/BillingPauseProvider";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { useGmailAccounts } from "@/hooks/useGmailAccounts";
import { formatLimit } from "@/lib/subscription";
import { REPLY_TONE_LABELS, REPLY_TONES } from "@/lib/openai";
import { DASHBOARD_SHORTCUTS } from "@/hooks/useDashboardKeyboardShortcuts";

export default function SettingsPage() {
  const { subscription, loading } = usePlanGate();
  const { paused, showComingSoon } = useBillingPause();
  const { data: session } = useSession();
  const { primaryAccount } = useGmailAccounts();

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
    const ids = [
      "profile",
      "notifications",
      "integrations",
      "preferences",
      "shortcuts",
      "billing",
      "account",
    ];
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
            <Suspense
              fallback={
                <p className={`text-sm ${dashboard.subtle}`}>Loading integrations…</p>
              }
            >
              <IntegrationsPanel />
            </Suspense>
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

          {/* Shortcuts */}
          <SettingsSection
            id="shortcuts"
            title="Keyboard shortcuts"
            description="Navigate Actora without leaving the keyboard."
          >
            <ul className="space-y-1.5">
              {DASHBOARD_SHORTCUTS.map((item) => (
                <li
                  key={item.keys}
                  className={`flex items-center justify-between gap-4 rounded-xl border ${dashboard.border} ${dashboard.surface} px-3 py-2.5`}
                >
                  <span className={`text-sm ${dashboard.muted}`}>
                    {item.description}
                  </span>
                  <kbd className="shrink-0 rounded-md border border-white/[0.08] bg-[#0A0A0A] px-2 py-1 text-[11px] font-medium text-[#93C5FD]">
                    {item.keys}
                  </kbd>
                </li>
              ))}
            </ul>
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

            <AiCreditWarningBanner subscription={subscription} />
            <div className="mb-4">
              <AiCreditsCard subscription={subscription} loading={loading} />
            </div>

            <PlanUsageDisplay subscription={subscription} loading={loading} />

            {subscription && (
              <div className="grid sm:grid-cols-2 gap-3 mt-2">
                <div className={`rounded-[18px] border ${dashboard.border} ${dashboard.surface} p-4`}>
                  <p className="text-sm font-medium text-white">AI credits / cycle</p>
                  <p className="text-sm font-semibold text-white mt-1 tabular-nums">
                    {formatLimit(subscription.limits.aiActionsPerMonth)}
                  </p>
                </div>
                <div className={`rounded-[18px] border ${dashboard.border} ${dashboard.surface} p-4`}>
                  <p className="text-sm font-medium text-white">Inbox limit</p>
                  <p className="text-sm font-semibold text-white mt-1 tabular-nums">
                    {formatLimit(subscription.limits.inboxes)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4">
              <AiCreditUsageHistory />
            </div>

            <Link
              href="/billing"
              onClick={(event) => {
                if (paused) {
                  event.preventDefault();
                  showComingSoon();
                }
              }}
              className={`${dashboard.btnPrimary} inline-flex items-center gap-2 mt-2 px-4 py-2.5 text-sm ${
                paused ? "opacity-80" : ""
              }`}
              aria-disabled={paused}
            >
              Manage billing
              {paused ? <ComingSoonBadge /> : null}
            </Link>
          </SettingsSection>

          {/* Account */}
          <SettingsSection
            id="account"
            title="Account"
            description="Session and account actions."
          >
            <div className={`rounded-[18px] border ${dashboard.border} ${dashboard.surface} p-4 ${dashboard.muted} text-sm`}>
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
