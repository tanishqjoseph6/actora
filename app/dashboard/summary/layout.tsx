import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function SummaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
