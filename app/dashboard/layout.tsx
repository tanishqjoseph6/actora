import { PlanGateProvider } from "@/components/subscription/PlanGateProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlanGateProvider>{children}</PlanGateProvider>;
}
