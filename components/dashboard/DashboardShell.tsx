"use client";

import { useState, type ReactNode } from "react";
import { PremiumSidebar } from "./premium/PremiumSidebar";
import { DashboardTopNav } from "./premium/DashboardTopNav";
import { dashboard } from "./premium/dashboard-tokens";
import { useResetSidebarOnMobile } from "@/hooks/useResetSidebarOnMobile";

type DashboardShellProps = {
  children: ReactNode;
  /** Mobile header title (defaults to "Actora") */
  mobileTitle?: string;
};

/** Shell for sub-pages — same design language as landing */
export function DashboardShell({
  children,
  mobileTitle,
}: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <DashboardTopNav
            onMenuClick={() => setMobileNavOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            title={mobileTitle}
          />

          <section className="premium-scrollbar mx-auto w-full max-w-[1600px] min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
