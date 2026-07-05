import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell mobileTitle="Inbox">{children}</DashboardShell>;
}
