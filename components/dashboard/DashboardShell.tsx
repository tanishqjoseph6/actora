"use client";

import { useState, type ReactNode } from "react";
import { PremiumSidebar } from "./premium/PremiumSidebar";
import { MobileDashboardHeader } from "./MobileDashboardHeader";
import { dashboard } from "./premium/dashboard-tokens";
import { useResetSidebarOnMobile } from "@/hooks/useResetSidebarOnMobile";

type DashboardShellProps = {
  children: ReactNode;
  /** Mobile header title (defaults to "Actora") */
  mobileTitle?: string;
};

/** Shell for sub-pages (CRM, etc.) without global search bar */
export function DashboardShell({
  children,
  mobileTitle,
}: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useResetSidebarOnMobile(setSidebarCollapsed);

  return (
    <main className={`min-h-screen ${dashboard.bg} text-white`}>
      <div className="relative flex min-h-screen min-w-0">
        <PremiumSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <MobileDashboardHeader
            title={mobileTitle}
            onMenuClick={() => setMobileNavOpen(true)}
          />

          <section className="flex-1 overflow-y-auto overflow-x-hidden premium-scrollbar p-4 sm:p-6 md:p-8 lg:p-10 min-w-0 max-w-[1600px] mx-auto w-full">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
