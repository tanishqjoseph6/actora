"use client";

import Link from "next/link";
import {
  CurrentPlanBadge,
  formatRenewalDate,
  PlanUsageDisplay,
} from "@/components/subscription/CurrentPlanBadge";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { formatLimit } from "@/lib/subscription";

export default function SettingsPage() {
  const { subscription, loading } = usePlanGate();

  return (
    <main className="min-h-screen bg-[#050816] text-white overflow-hidden">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-cyan-500/8 blur-[180px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-[rgba(0,255,255,0.25)] text-[#00CFFF] text-sm font-medium bg-[#081226]/60 backdrop-blur-sm">
              ⚙️ Settings
            </div>
            <CurrentPlanBadge
              subscription={subscription}
              loading={loading}
              compact
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold">
            Account <span className="text-cyan-400">Settings</span>
          </h1>
          <p className="text-gray-400 mt-3">
            Manage your workspace preferences and subscription.
          </p>
        </div>

        <div className="space-y-5">
          {/* Subscription */}
          <section className="rounded-2xl bg-[#081226]/80 backdrop-blur-sm border border-[rgba(0,255,255,0.15)] p-6 sm:p-8 shadow-lg shadow-black/20">
            <h2 className="text-lg font-bold text-white mb-1">
              Billing & Subscription
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Your current plan and usage limits.
            </p>

            <div className="mb-6">
              <CurrentPlanBadge subscription={subscription} loading={loading} />
              {subscription && (
                <p className="text-sm text-gray-400 mt-2">
                  Renews on{" "}
                  <span className="text-gray-300">
                    {formatRenewalDate(subscription.currentPeriodEnd)}
                  </span>
                  {" · "}
                  {subscription.billingInterval === "yearly"
                    ? "Yearly"
                    : "Monthly"}{" "}
                  billing
                </p>
              )}
            </div>

            <PlanUsageDisplay subscription={subscription} loading={loading} />

            {subscription && (
              <div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-[#0d1730]/60 border border-[rgba(0,255,255,0.1)] p-4">
                  <p className="text-gray-500">AI actions limit</p>
                  <p className="text-white font-medium mt-1">
                    {formatLimit(subscription.limits.aiActionsPerMonth)}/month
                  </p>
                </div>
                <div className="rounded-xl bg-[#0d1730]/60 border border-[rgba(0,255,255,0.1)] p-4">
                  <p className="text-gray-500">Inbox limit</p>
                  <p className="text-white font-medium mt-1">
                    {formatLimit(subscription.limits.inboxes)}
                  </p>
                </div>
              </div>
            )}

            <Link
              href="/billing"
              className="inline-flex mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#00CFFF] text-[#050816] text-sm font-semibold hover:brightness-110 transition-all duration-300 shadow-md shadow-cyan-500/20"
            >
              Manage Billing
            </Link>
          </section>

          <section className="rounded-2xl bg-[#081226]/80 backdrop-blur-sm border border-[rgba(0,255,255,0.15)] p-6 shadow-lg shadow-black/20">
            <h2 className="text-base font-semibold text-white">
              Email Notifications
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Configure inbox alerts and digests.
            </p>
          </section>

          <section className="rounded-2xl bg-[#081226]/80 backdrop-blur-sm border border-[rgba(0,255,255,0.15)] p-6 shadow-lg shadow-black/20">
            <h2 className="text-base font-semibold text-white">
              Connected Accounts
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Google Gmail and calendar integrations.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
