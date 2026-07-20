"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CurrentPlanBadge } from "@/components/subscription/CurrentPlanBadge";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import {
  CRM_NAV,
  FOOTER_NAV,
  MAIN_NAV,
  type NavItem,
} from "@/components/dashboard/nav-config";
import { NAV_ICONS } from "@/components/dashboard/nav-icons";

type DashboardSidebarProps = {
  onNavigate?: () => void;
  className?: string;
};

export function DashboardSidebar({
  onNavigate,
  className = "",
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { subscription, loading } = usePlanGate();
  return (
    <aside
      className={`flex flex-col w-64 min-h-full border-r border-blue-400/20 bg-[#0A0A0A]/70 backdrop-blur-xl p-6 shrink-0 ${className}`}
    >
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="text-4xl font-bold text-blue-400 mb-8 hover:text-blue-300 transition-colors"
      >
        Actora
      </Link>

      <nav className="space-y-1 flex-1 overflow-y-auto">
        <NavGroup items={MAIN_NAV} pathname={pathname} onNavigate={onNavigate} />

        <div className="pt-4 mt-4 border-t border-blue-400/15">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            CRM
          </p>
          <NavGroup items={CRM_NAV} pathname={pathname} onNavigate={onNavigate} />
        </div>

        <div className="pt-4 mt-4 border-t border-blue-400/15">
          <NavGroup
            items={FOOTER_NAV}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        </div>
      </nav>

      <div className="mt-auto pt-6 border-t border-blue-400/20 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Plan</p>
          <CurrentPlanBadge
            subscription={subscription}
            loading={loading}
            compact
          />
        </div>
        <p className="text-blue-400 font-semibold">Tanishq</p>
        <p className="text-gray-400 text-sm">Founder</p>
      </div>
    </aside>
  );
}

function NavGroup({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = NAV_ICONS[item.icon];
        const active = item.exact
          ? pathname === item.href
          : item.matchPrefix
            ? pathname === item.href ||
              pathname.startsWith(`${item.matchPrefix}/`)
            : pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`
              flex items-center gap-2.5 p-3 rounded-xl text-sm font-medium transition-all duration-200
              ${
                active
                  ? "bg-blue-500/10 border border-blue-400/20 text-blue-300"
                  : "border border-transparent text-gray-300 hover:bg-blue-500/10 hover:text-white"
              }
            `}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
