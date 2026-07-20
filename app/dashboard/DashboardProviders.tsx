"use client";

import { PlanGateProvider } from "@/components/subscription/PlanGateProvider";
import { PlanActivationToastListener } from "@/components/billing/PlanActivationToastListener";
import { TrialBanner } from "@/components/subscription/TrialBanner";
import { DashboardShellLayout } from "@/components/dashboard/DashboardShellLayout";

/**
 * Dashboard-scoped providers + the one shared shell (sidebar + top nav).
 * Pages under /dashboard should only render page content as children.
 */
export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <PlanGateProvider>
      <PlanActivationToastListener />
      <div className="bg-[#0A0A0A] px-5 pt-4 sm:px-8 lg:px-10">
        <TrialBanner />
      </div>
      <DashboardShellLayout>{children}</DashboardShellLayout>
    </PlanGateProvider>
  );
}
