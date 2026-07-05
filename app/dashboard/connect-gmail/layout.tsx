import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function ConnectGmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell mobileTitle="Connect Gmail">{children}</DashboardShell>
  );
}
