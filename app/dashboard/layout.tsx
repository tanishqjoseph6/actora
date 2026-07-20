import { DashboardProviders } from "./DashboardProviders";

/**
 * Single dashboard chrome owner.
 * Sidebar + top nav are rendered once here (via DashboardShellLayout).
 * Nested route layouts must NOT wrap DashboardShell / PremiumSidebar.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardProviders>{children}</DashboardProviders>;
}
