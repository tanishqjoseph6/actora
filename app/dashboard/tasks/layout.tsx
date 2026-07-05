import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
