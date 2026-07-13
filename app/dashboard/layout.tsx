import { PlanGateProvider } from "@/components/subscription/PlanGateProvider";
import { PlanActivationToastListener } from "@/components/billing/PlanActivationToastListener";
import { TrialBanner } from "@/components/subscription/TrialBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PlanGateProvider>
      <PlanActivationToastListener />
      <div className="px-5 pt-4 sm:px-8 lg:px-10">
        <TrialBanner />
      </div>
      {children}
    </PlanGateProvider>
  );
}
