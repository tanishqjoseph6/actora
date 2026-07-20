import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
