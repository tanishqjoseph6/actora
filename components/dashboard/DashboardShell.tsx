"use client";

import type { ReactNode } from "react";

type DashboardShellProps = {
  children: ReactNode;
  /** @deprecated Unused — title is owned by the shared dashboard layout. */
  mobileTitle?: string;
};

/**
 * Content-only wrapper. The global sidebar + top nav live exclusively in
 * `app/dashboard/layout.tsx` via `DashboardShellLayout`. Do not render
 * `PremiumSidebar` here — that caused nested duplicate sidebars.
 */
export function DashboardShell({ children }: DashboardShellProps) {
  return <>{children}</>;
}
