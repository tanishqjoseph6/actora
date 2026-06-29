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
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`
              inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap
              transition-all duration-200 shrink-0
              ${
                active
                  ? "bg-gradient-to-r from-[#3B82F6]/20 to-[#00CFFF]/20 border border-cyan-400/40 text-cyan-300 shadow-sm shadow-cyan-500/10"
                  : "bg-[#0d1730]/60 border border-cyan-400/10 text-gray-400 hover:border-cyan-400/25 hover:text-gray-200"
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
