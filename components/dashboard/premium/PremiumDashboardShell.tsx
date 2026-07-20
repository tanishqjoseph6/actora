"use client";

import { useState, type ReactNode } from "react";
import { PremiumSidebar } from "./PremiumSidebar";
import { DashboardTopNav } from "./DashboardTopNav";
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
  searchQuery: controlledQuery,
  onSearchChange,
  showTopNav = true,
  contentClassName = "p-4 sm:p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto w-full",
}: PremiumDashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState("");

  useResetSidebarOnMobile(setSidebarCollapsed);

  const searchQuery = controlledQuery ?? localQuery;
  const handleSearchChange = onSearchChange ?? setLocalQuery;

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
          {showTopNav && (
            <DashboardTopNav
              onMenuClick={() => setMobileNavOpen(true)}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
            />
          )}

          <div
            className={`premium-scrollbar flex-1 overflow-x-hidden overflow-y-auto ${contentClassName}`}
          >
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
