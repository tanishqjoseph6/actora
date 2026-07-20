"use client";

import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
  { id: "integrations", label: "Integrations" },
  { id: "preferences", label: "Preferences" },
  { id: "billing", label: "Billing" },
  { id: "account", label: "Account" },
] as const;

type SettingsSidebarProps = {
  activeId?: string;
};

export function SettingsSidebar({ activeId }: SettingsSidebarProps) {
  return (
    <nav
      className={`${dashboard.cardBase} p-2 lg:sticky lg:top-6`}
      aria-label="Settings sections"
    >
      <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible premium-scrollbar">
        {SECTIONS.map((section) => {
          const active = activeId === section.id;
          return (
            <li key={section.id} className="shrink-0 lg:shrink">
              <a
                href={`#${section.id}`}
                className={`
                  block px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                  ${
                    active
                      ? "bg-[#2563EB]/15 text-[#93C5FD] border border-[#2563EB]/30"
                      : "text-[#71717A] hover:text-white hover:bg-white/[0.04] border border-transparent"
                  }
                `}
              >
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SettingsHeader() {
  return (
    <div className="mb-6 lg:mb-8">
      <p className={`text-sm ${dashboard.subtle} mb-2`}>⚙️ Workspace</p>
      <h1 className={dashboard.pageTitle}>
        Settings
      </h1>
      <p className={`${dashboard.muted} mt-2 text-sm sm:text-base max-w-xl`}>
        Manage your profile, notifications, integrations, and subscription.
      </p>
    </div>
  );
}
