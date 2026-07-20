"use client";

import type { ReactNode } from "react";

type PremiumDashboardShellProps = {
  children: ReactNode;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  showTopNav?: boolean;
  contentClassName?: string;
};

/**
 * Content-only wrapper. The global sidebar + top nav live exclusively in
 * `app/dashboard/layout.tsx` via `DashboardShellLayout`. Do not render
 * `PremiumSidebar` here — that caused nested duplicate sidebars.
 */
export function PremiumDashboardShell({
  children,
}: PremiumDashboardShellProps) {
  return <>{children}</>;
}
