import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function MeetingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
