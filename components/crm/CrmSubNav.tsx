"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CRM_TABS } from "@/components/dashboard/nav-config";

export function CrmSubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-1 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none"
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
                  : "bg-[#111827]/60 border border-blue-400/10 text-gray-400 hover:border-blue-400/25 hover:text-gray-200"
              }
            `}
          >
            <span aria-hidden>{tab.icon}</span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
