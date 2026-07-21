"use client";

import { memo, useCallback, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PremiumSidebar } from "./premium/PremiumSidebar";
import { DashboardTopNav } from "./premium/DashboardTopNav";
import { DashboardPageTransition } from "./DashboardPageTransition";
import { dashboard } from "./premium/dashboard-tokens";
import { DASHBOARD_MOBILE_TITLES } from "./nav-config";
import { useResetSidebarOnMobile } from "@/hooks/useResetSidebarOnMobile";
import { useRoutePrefetch } from "@/hooks/useRoutePrefetch";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";

function resolveMobileTitle(pathname: string): string | undefined {
  if (pathname === "/dashboard") return "Roxx AI";
  if (DASHBOARD_MOBILE_TITLES[pathname]) {
    return DASHBOARD_MOBILE_TITLES[pathname];
  }
  if (pathname.startsWith("/dashboard/crm/contacts")) return "Contacts";
  if (pathname.startsWith("/dashboard/crm/companies")) return "Companies";
  if (pathname.startsWith("/dashboard/crm/pipeline")) return "Pipeline";
  if (pathname.startsWith("/dashboard/crm/deals")) return "Deals";
  return undefined;
}

function DashboardShellLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const scrollRef = useScrollRestoration<HTMLElement>();

  useRoutePrefetch();
  useResetSidebarOnMobile(setSidebarCollapsed);

  const mobileTitle = useMemo(() => resolveMobileTitle(pathname), [pathname]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((c) => !c);
  }, []);

  const handleOpenMobileNav = useCallback(() => {
    setMobileNavOpen(true);
  }, []);

  const handleCloseMobileNav = useCallback(() => {
    setMobileNavOpen(false);
  }, []);

  return (
    <main className={`min-h-screen ${dashboard.bg} text-white`}>
      <div className="relative flex min-h-screen min-w-0">
        <PremiumSidebar
          collapsed={sidebarCollapsed}
          onToggle={handleToggleSidebar}
          mobileOpen={mobileNavOpen}
          onMobileClose={handleCloseMobileNav}
        />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <DashboardTopNav
            onMenuClick={handleOpenMobileNav}
            title={mobileTitle}
          />

          <section
            ref={scrollRef}
            className="premium-scrollbar mx-auto w-full max-w-[1600px] min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10"
          >
            <DashboardPageTransition>{children}</DashboardPageTransition>
          </section>
        </div>
      </div>
    </main>
  );
}

export const DashboardShellLayout = memo(DashboardShellLayoutInner);
