"use client";

import { useState } from "react";
import { CurrentPlanBadge } from "@/components/subscription/CurrentPlanBadge";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { subscription, loading } = usePlanGate();

  return (
    <main className="min-h-screen bg-[#050816] text-white overflow-hidden">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-blue-500/10 blur-[220px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/8 blur-[180px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex min-h-screen">
        <div className="hidden lg:flex shrink-0">
          <DashboardSidebar className="min-h-screen sticky top-0" />
        </div>

        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            />
            <div className="absolute inset-y-0 left-0 z-50 animate-slide-in-right">
              <DashboardSidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-5 py-4 border-b border-blue-400/15 bg-[#050816]/90 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-xl border border-blue-400/20 text-blue-400 hover:bg-blue-500/10 transition-colors"
              aria-label="Open menu"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <span className="text-xl font-bold text-blue-400">Actora</span>
            <CurrentPlanBadge
              subscription={subscription}
              loading={loading}
              compact
            />
          </header>

          <section className="flex-1 p-5 sm:p-8 lg:p-10 min-w-0">{children}</section>
        </div>
      </div>
    </main>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}
