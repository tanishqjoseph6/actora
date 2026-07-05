import type { PlanFeature } from "@/lib/subscription";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  /** Prefix match for nested routes (e.g. /dashboard/crm) */
  matchPrefix?: string;
  /** Only highlight when pathname matches href exactly */
  exact?: boolean;
  /** Plan feature required to access this nav item */
  feature?: PlanFeature;
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

export const MAIN_NAV: NavItem[] = [
  { href: "/dashboard/inbox", label: "Inbox", icon: "📥", matchPrefix: "/dashboard/inbox" },
  { href: "/dashboard", label: "Overview", icon: "🏠", exact: true },
  {
    href: "/dashboard/automations",
    label: "Automations",
    icon: "🤖",
    matchPrefix: "/dashboard/automations",
    feature: "automations",
  },
  {
    href: "/dashboard/actions",
    label: "Actions",
    icon: "⚡",
    feature: "automations",
  },
  {
    href: "/dashboard/meetings",
    label: "Meetings",
    icon: "📅",
    feature: "meetings",
  },
  { href: "/dashboard/tasks", label: "Tasks", icon: "📝" },
  {
    href: "/dashboard/summary",
    label: "Analytics",
    icon: "📊",
    feature: "analytics",
  },
];

export const CRM_NAV: NavItem[] = [
  {
    href: "/dashboard/crm",
    label: "Overview",
    icon: "✨",
    matchPrefix: "/dashboard/crm",
    exact: true,
  },
  {
    href: "/dashboard/crm/contacts",
    label: "Contacts",
    icon: "👤",
    matchPrefix: "/dashboard/crm/contacts",
  },
  {
    href: "/dashboard/crm/companies",
    label: "Companies",
    icon: "🏢",
    matchPrefix: "/dashboard/crm/companies",
    feature: "full_crm",
  },
  {
    href: "/dashboard/crm/pipeline",
    label: "Pipeline",
    icon: "📊",
    matchPrefix: "/dashboard/crm/pipeline",
    feature: "full_crm",
  },
  {
    href: "/dashboard/crm/deals",
    label: "Deals",
    icon: "💼",
    matchPrefix: "/dashboard/crm/deals",
    feature: "full_crm",
  },
];

export const FOOTER_NAV: NavItem[] = [
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export type CrmTab = {
  href: string;
  label: string;
  icon: string;
  feature?: PlanFeature;
};

export const CRM_TABS: CrmTab[] = [
  { href: "/dashboard/crm", label: "Overview", icon: "✨" },
  { href: "/dashboard/crm/contacts", label: "Contacts", icon: "👤" },
  {
    href: "/dashboard/crm/companies",
    label: "Companies",
    icon: "🏢",
    feature: "full_crm",
  },
  {
    href: "/dashboard/crm/pipeline",
    label: "Pipeline",
    icon: "📊",
    feature: "full_crm",
  },
  {
    href: "/dashboard/crm/deals",
    label: "Deals",
    icon: "💼",
    feature: "full_crm",
  },
];
