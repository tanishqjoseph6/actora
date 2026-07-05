"use client";

import { useState, type ReactNode } from "react";
import { PremiumSidebar } from "./PremiumSidebar";
import { DashboardTopNav } from "./DashboardTopNav";
import { MobileDashboardHeader } from "../MobileDashboardHeader";
import { dashboard } from "./dashboard-tokens";
import { useResetSidebarOnMobile } from "@/hooks/useResetSidebarOnMobile";

type PremiumDashboardShellProps = {
  children: ReactNode;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  showTopNav?: boolean;
  contentClassName?: string;
};

export function PremiumDashboardShell({
  children,
  searchQuery = "",
  onSearchChange,
  showTopNav = true,
  contentClassName = "p-4 sm:p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto w-full",
}: PremiumDashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useResetSidebarOnMobile(setSidebarCollapsed);

  const hasSearch = Boolean(onSearchChange);

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
          {showTopNav && hasSearch ? (
            <DashboardTopNav
              onMenuClick={() => setMobileNavOpen(true)}
              searchQuery={searchQuery}
              onSearchChange={onSearchChange!}
            />
          ) : (
            <MobileDashboardHeader onMenuClick={() => setMobileNavOpen(true)} />
          )}

          <div className={`flex-1 overflow-y-auto overflow-x-hidden premium-scrollbar ${contentClassName}`}>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
