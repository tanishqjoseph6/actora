"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CRM_TABS } from "@/components/dashboard/nav-config";

export function CrmSubNav() {
  const pathname = usePathname();

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

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap
                transition-all duration-200 shrink-0
                ${
                  active
                    ? "bg-[#2563EB]/15 border border-[#2563EB]/40 text-white"
                    : "bg-[#111827] border border-[#1E293B] text-[#94A3B8] hover:border-[#2563EB]/35 hover:text-white"
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
