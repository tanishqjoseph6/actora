"use client";

import { useCallback, useState } from "react";
import { PlanGateProvider } from "@/components/subscription/PlanGateProvider";
import { PlanActivationToastListener } from "@/components/billing/PlanActivationToastListener";
import { TrialBanner } from "@/components/subscription/TrialBanner";
import { DashboardShellLayout } from "@/components/dashboard/DashboardShellLayout";
import { ToastProvider } from "@/providers/ToastProvider";
import { NotificationsProvider } from "@/providers/NotificationsProvider";
import { KeyboardShortcutsModal } from "@/components/dashboard/nav/KeyboardShortcutsModal";
import { useDashboardKeyboardShortcuts } from "@/hooks/useDashboardKeyboardShortcuts";

function DashboardKeyboardLayer({ children }: { children: React.ReactNode }) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);
  useDashboardKeyboardShortcuts({ onOpenShortcuts: openShortcuts });

  return (
    <>
      {children}
      <KeyboardShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </>
  );
}

/**
 * Dashboard-scoped providers + the one shared shell (sidebar + top nav).
 * Pages under /dashboard should only render page content as children.
 */
export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <PlanGateProvider>
      <NotificationsProvider>
        <ToastProvider>
          <PlanActivationToastListener />
          <div className="bg-[#0A0A0A] px-5 pt-4 sm:px-8 lg:px-10">
            <TrialBanner />
          </div>
          <DashboardKeyboardLayer>
            <DashboardShellLayout>{children}</DashboardShellLayout>
          </DashboardKeyboardLayer>
        </ToastProvider>
      </NotificationsProvider>
    </PlanGateProvider>
  );
}
