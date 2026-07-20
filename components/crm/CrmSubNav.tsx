"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CRM_TABS } from "@/components/dashboard/nav-config";
import { UpgradeButton } from "@/components/subscription/UpgradeButton";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { getFeatureUpgradePlan } from "@/lib/subscription";

export function CrmSubNav() {
  const pathname = usePathname();
  const { canAccessFeature } = usePlanGate();

  return (
    <div className="relative -mx-1">
      <nav
        className="flex gap-1 sm:gap-2 overflow-x-auto pb-1 px-1 premium-scrollbar scroll-smooth"
        aria-label="CRM sections"
      >
        {CRM_TABS.map((tab) => {
          const active =
            tab.href === "/dashboard/crm"
              ? pathname === "/dashboard/crm"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          const locked =
            tab.feature != null && !canAccessFeature(tab.feature);

          if (locked) {
            return (
              <div
                key={tab.href}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 bg-[#111111] border border-white/[0.06] opacity-75"
              >
                <span aria-hidden>{tab.icon}</span>
                <span className="text-[#71717A]">{tab.label}</span>
                <UpgradeButton plan={getFeatureUpgradePlan(tab.feature!)} />
              </div>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap
                transition-all duration-200 shrink-0
                ${
                  active
                    ? "bg-[#3B82F6]/15 border border-[#3B82F6]/40 text-white"
                    : "bg-[#111111] border border-white/[0.06] text-[#A1A1AA] hover:border-[#3B82F6]/35 hover:text-white"
                }
              `}
            >
              <span aria-hidden>{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
