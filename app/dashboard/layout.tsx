import { PlanGateProvider } from "@/components/subscription/PlanGateProvider";
import { PlanActivationToastListener } from "@/components/billing/PlanActivationToastListener";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PlanGateProvider>
      <PlanActivationToastListener />
      {children}
    </PlanGateProvider>
  );
}
