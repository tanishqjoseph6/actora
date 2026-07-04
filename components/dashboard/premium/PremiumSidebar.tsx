"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { CurrentPlanBadge } from "@/components/subscription/CurrentPlanBadge";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import {
  CRM_NAV,
  FOOTER_NAV,
  MAIN_NAV,
  type NavItem,
} from "@/components/dashboard/nav-config";

type PremiumSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function PremiumSidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: PremiumSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { subscription, loading } = usePlanGate();

  const displayName = session?.user?.name ?? session?.user?.email ?? "User";
  const displayInitial = displayName.charAt(0).toUpperCase();

  const content = (
    <motion.aside
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="flex flex-col h-full border-r border-[#1E293B] bg-[#0B1220] shrink-0 overflow-hidden"
    >
      <div className="flex items-center justify-between gap-2 p-4 border-b border-[#1E293B]">
        <Link
          href="/dashboard"
          className={`font-bold text-white ${collapsed ? "text-lg" : "text-2xl"}`}
        >
          {collapsed ? "A" : "Actora"}
        </Link>
        <button
          type="button"
          onClick={onToggle}
          className="hidden lg:flex p-2 rounded-xl border border-[#1E293B] text-gray-400 hover:text-[#2563EB] hover:border-[#1E293B] transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronIcon className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        <NavSection title="Workspace" items={MAIN_NAV} pathname={pathname} collapsed={collapsed} onNavigate={onMobileClose} />
        <NavSection title="CRM" items={CRM_NAV} pathname={pathname} collapsed={collapsed} onNavigate={onMobileClose} />
        <NavSection title="" items={FOOTER_NAV} pathname={pathname} collapsed={collapsed} onNavigate={onMobileClose} />
      </nav>

      <div className="p-4 border-t border-[#1E293B]">
        {!collapsed && (
          <div className="mb-3">
            <CurrentPlanBadge subscription={subscription} loading={loading} compact />
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-xs font-bold text-white shrink-0">
            {displayInitial}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              <p className="text-xs text-[#64748B] truncate">{session?.user?.email ?? "Signed in"}</p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );

  return (
    <>
      <div className="hidden lg:block h-screen sticky top-0">{content}</div>
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={onMobileClose}
              aria-label="Close menu"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="absolute inset-y-0 left-0 w-[260px]"
            >
              {content}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavSection({
  title,
  items,
  pathname,
  collapsed,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div>
      {title && !collapsed && (
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
          {title}
        </p>
      )}
      <div className="space-y-1">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : item.matchPrefix
              ? pathname === item.href || pathname.startsWith(`${item.matchPrefix}/`)
              : pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-sm font-medium transition-all duration-200
                ${active
                  ? "bg-[#2563EB]/15 border border-[#2563EB]/40 text-white"
                  : "border border-transparent text-[#94A3B8] hover:text-white hover:bg-[#111827] hover:border-[#1E293B]"
                }
              `}
            >
              <span className="text-lg shrink-0" aria-hidden>{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
