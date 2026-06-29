import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
