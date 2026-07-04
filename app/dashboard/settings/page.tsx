"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  CurrentPlanBadge,
  formatRenewalDate,
  PlanUsageDisplay,
} from "@/components/subscription/CurrentPlanBadge";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { formatLimit } from "@/lib/subscription";

export default function SettingsPage() {
  const { subscription, loading } = usePlanGate();
  const { data: session } = useSession();

  return (
    <main className="min-h-screen bg-[#050816] text-white overflow-hidden">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-blue-500/8 blur-[180px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-[rgba(37, 99, 235,0.25)] text-[#3B82F6] text-sm font-medium bg-[#0B1220]/60 backdrop-blur-sm">
              ⚙️ Settings
            </div>
            <CurrentPlanBadge
              subscription={subscription}
              loading={loading}
              compact
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold">
            Account <span className="text-blue-400">Settings</span>
          </h1>
          <p className="text-gray-400 mt-3">
            Manage your workspace preferences and subscription.
          </p>
        </div>

        <div className="space-y-5">
          {/* Subscription */}
          <section className="rounded-2xl bg-[#0B1220]/80 backdrop-blur-sm border border-[rgba(37, 99, 235,0.15)] p-6 sm:p-8 shadow-lg shadow-black/20">
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
                <div className="rounded-xl bg-[#111827]/60 border border-[rgba(37, 99, 235,0.1)] p-4">
                  <p className="text-gray-500">AI actions limit</p>
                  <p className="text-white font-medium mt-1">
                    {formatLimit(subscription.limits.aiActionsPerMonth)}/month
                  </p>
                </div>
                <div className="rounded-xl bg-[#111827]/60 border border-[rgba(37, 99, 235,0.1)] p-4">
                  <p className="text-gray-500">Inbox limit</p>
                  <p className="text-white font-medium mt-1">
                    {formatLimit(subscription.limits.inboxes)}
                  </p>
                </div>
              </div>
            )}

            <Link
              href="/billing"
              className="inline-flex mt-6 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-sm font-semibold hover:bg-[#1D4ED8] transition-all duration-300 shadow-md shadow-blue-500/20"
            >
              Manage Billing
            </Link>
          </section>

          <section className="rounded-2xl bg-[#0B1220]/80 backdrop-blur-sm border border-[rgba(37, 99, 235,0.15)] p-6 shadow-lg shadow-black/20">
            <h2 className="text-base font-semibold text-white">
              Email Notifications
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Configure inbox alerts and digests.
            </p>
          </section>

          <section className="rounded-2xl bg-[#0B1220]/80 backdrop-blur-sm border border-[rgba(37, 99, 235,0.15)] p-6 shadow-lg shadow-black/20">
            <h2 className="text-base font-semibold text-white">
              Connected Accounts
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Google Gmail and calendar integrations.
            </p>
            {session?.user?.email && (
              <p className="text-sm text-gray-300 mt-3">
                Signed in as <span className="text-white">{session.user.email}</span>
              </p>
            )}
          </section>

          <section className="rounded-2xl bg-[#0B1220]/80 backdrop-blur-sm border border-[rgba(37, 99, 235,0.15)] p-6 shadow-lg shadow-black/20">
            <h2 className="text-base font-semibold text-white">Sign out</h2>
            <p className="text-sm text-gray-400 mt-1 mb-4">
              End your Actora session on this device.
            </p>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-5 py-2.5 rounded-xl border border-rose-400/30 text-rose-300 text-sm font-medium hover:bg-rose-500/10 transition-colors"
            >
              Sign out
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
