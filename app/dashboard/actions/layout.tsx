import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function ActionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell mobileTitle="Actions">{children}</DashboardShell>;
}
