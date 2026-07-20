"use client";

import { memo } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronLeft, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ActoraLogo } from "@/components/branding/ActoraLogo";
import { CurrentPlanBadge } from "@/components/subscription/CurrentPlanBadge";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { PrefetchLink } from "@/components/dashboard/PrefetchLink";
import {
  CRM_NAV,
  FOOTER_NAV,
  MAIN_NAV,
  type NavItem,
} from "@/components/dashboard/nav-config";
import { NAV_ICONS } from "@/components/dashboard/nav-icons";
import { UpgradeButton } from "@/components/subscription/UpgradeButton";
import {
  getFeatureUpgradePlan,
  type PlanFeature,
  type PlanId,
} from "@/lib/subscription";
import { cn } from "@/lib/utils";

type PremiumSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export const PremiumSidebar = memo(function PremiumSidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: PremiumSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { subscription, loading, canAccessFeature } = usePlanGate();

  const displayName = session?.user?.name ?? session?.user?.email ?? "User";
  const displayInitial = displayName.charAt(0).toUpperCase();
  const showCrmSection = pathname.startsWith("/dashboard/crm");

  const panelProps = {
    pathname,
    displayName,
    displayInitial,
    email: session?.user?.email,
    subscription,
    loading,
    canAccessFeature,
    onToggle,
    showCrmSection,
  };

  return (
    <>
      <div className="hidden lg:block h-screen sticky top-0 p-3 pr-0">
        <SidebarPanel collapsed={collapsed} {...panelProps} />
      </div>

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
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="absolute inset-y-0 left-0 w-[min(100vw-3rem,288px)] p-3"
            >
              <SidebarPanel
                collapsed={false}
                {...panelProps}
                onNavigate={onMobileClose}
                onClose={onMobileClose}
                isMobile
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
});

function SidebarPanel({
  collapsed,
  onToggle,
  pathname,
  displayName,
  displayInitial,
  email,
  subscription,
  loading,
  canAccessFeature,
  onNavigate,
  onClose,
  isMobile,
  showCrmSection,
}: {
  collapsed: boolean;
  onToggle: () => void;
  pathname: string;
  displayName: string;
  displayInitial: string;
  email?: string | null;
  subscription: ReturnType<typeof usePlanGate>["subscription"];
  loading: boolean;
  canAccessFeature: (feature: PlanFeature, planId?: PlanId) => boolean;
  onNavigate?: () => void;
  onClose?: () => void;
  isMobile?: boolean;
  showCrmSection: boolean;
}) {
  return (
    <aside
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#111111] shadow-[0_24px_80px_rgba(0,0,0,0.35)] transition-[width] duration-300 ease-out",
        isMobile ? "w-full" : undefined
      )}
      style={!isMobile ? { width: collapsed ? 76 : 248 } : undefined}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] p-4">
        <ActoraLogo
          href="/dashboard"
          size={collapsed && !isMobile ? 26 : 28}
          showWordmark={!collapsed || Boolean(isMobile)}
          wordmarkClassName="text-[15px] font-semibold tracking-tight text-white"
          className="min-w-0"
        />
        {isMobile && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/[0.08] p-2 text-[#71717A] transition-colors hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            className="hidden rounded-xl border border-white/[0.08] p-2 text-[#71717A] transition-colors hover:border-[#3B82F6]/35 hover:text-white lg:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </button>
        )}
      </div>

      <nav className="premium-scrollbar flex-1 space-y-5 overflow-y-auto p-3">
        <NavSection
          title="Workspace"
          items={MAIN_NAV}
          pathname={pathname}
          collapsed={collapsed && !isMobile}
          onNavigate={onNavigate}
          canAccessFeature={canAccessFeature}
        />
        {showCrmSection && (
          <NavSection
            title="CRM"
            items={CRM_NAV}
            pathname={pathname}
            collapsed={collapsed && !isMobile}
            onNavigate={onNavigate}
            canAccessFeature={canAccessFeature}
          />
        )}
        <NavSection
          title="Account"
          items={FOOTER_NAV}
          pathname={pathname}
          collapsed={collapsed && !isMobile}
          onNavigate={onNavigate}
          canAccessFeature={canAccessFeature}
        />
      </nav>

      <div className="border-t border-white/[0.06] p-4">
        {(!collapsed || isMobile) && (
          <div className="mb-3">
            <CurrentPlanBadge
              subscription={subscription}
              loading={loading}
              compact
            />
          </div>
        )}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6] text-xs font-semibold text-white">
            {displayInitial}
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {displayName}
              </p>
              <p className="truncate text-xs text-[#71717A]">
                {email ?? "Signed in"}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function NavSection({
  title,
  items,
  pathname,
  collapsed,
  onNavigate,
  canAccessFeature,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
  canAccessFeature: (feature: PlanFeature, planId?: PlanId) => boolean;
}) {
  return (
    <div>
      {title && !collapsed && (
        <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#52525B]">
          {title}
        </p>
      )}
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = NAV_ICONS[item.icon];
          const locked =
            item.feature != null && !canAccessFeature(item.feature);
          const active = item.exact
            ? pathname === item.href
            : item.matchPrefix
              ? pathname === item.href ||
                pathname.startsWith(`${item.matchPrefix}/`)
              : pathname === item.href;

          if (locked) {
            const upgradePlan = getFeatureUpgradePlan(item.feature!);
            return (
              <div
                key={item.href}
                title={collapsed ? item.label : undefined}
                className="flex items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 opacity-70"
              >
                <Icon className="h-4 w-4 shrink-0 text-[#52525B]" strokeWidth={1.75} />
                {!collapsed && (
                  <>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#71717A]">
                      {item.label}
                    </span>
                    <UpgradeButton plan={upgradePlan} />
                  </>
                )}
              </div>
            );
          }

          return (
            <PrefetchLink
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={item.label}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 interactive-press",
                active
                  ? "border border-[#3B82F6]/35 bg-[#3B82F6]/15 text-white shadow-[0_0_0_1px_rgba(59,130,246,0.08)]"
                  : "border border-transparent text-[#A1A1AA] hover:-translate-x-0 hover:bg-white/[0.03] hover:text-white"
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-[#3B82F6]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active
                    ? "text-[#93C5FD]"
                    : "text-[#71717A] group-hover:text-[#A1A1AA]"
                )}
                strokeWidth={1.75}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {collapsed && (
                <span className="pointer-events-none absolute left-full z-20 ml-3 whitespace-nowrap rounded-lg border border-white/[0.08] bg-[#111111] px-2.5 py-1.5 text-xs text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
                  {item.label}
                </span>
              )}
            </PrefetchLink>
          );
        })}
      </div>
    </div>
  );
}
