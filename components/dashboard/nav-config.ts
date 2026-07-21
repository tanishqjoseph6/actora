import type { PlanFeature } from "@/lib/subscription";

export type NavIconName =
  | "inbox"
  | "crm"
  | "tasks"
  | "meetings"
  | "automations"
  | "assistant"
  | "analytics"
  | "billing"
  | "settings"
  | "contacts"
  | "companies"
  | "pipeline"
  | "deals"
  | "overview"
  | "actions";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
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

/** Primary workspace nav — matches landing product surfaces */
export const MAIN_NAV: NavItem[] = [
  {
    href: "/dashboard/inbox",
    label: "AI Inbox",
    icon: "inbox",
    matchPrefix: "/dashboard/inbox",
  },
  {
    href: "/dashboard/crm",
    label: "CRM",
    icon: "crm",
    matchPrefix: "/dashboard/crm",
  },
  { href: "/dashboard/tasks", label: "Tasks", icon: "tasks" },
  {
    href: "/dashboard/calendar",
    label: "Calendar",
    icon: "meetings",
    matchPrefix: "/dashboard/calendar",
    feature: "meetings",
  },
  {
    href: "/dashboard/automations",
    label: "Automations",
    icon: "automations",
    matchPrefix: "/dashboard/automations",
    feature: "automations",
  },
  {
    href: "/dashboard",
    label: "Roxx AI",
    icon: "assistant",
    exact: true,
  },
  {
    href: "/dashboard/summary",
    label: "Analytics",
    icon: "analytics",
    feature: "analytics",
  },
];

export const CRM_NAV: NavItem[] = [
  {
    href: "/dashboard/crm",
    label: "Overview",
    icon: "overview",
    matchPrefix: "/dashboard/crm",
    exact: true,
  },
  {
    href: "/dashboard/crm/contacts",
    label: "Contacts",
    icon: "contacts",
    matchPrefix: "/dashboard/crm/contacts",
  },
  {
    href: "/dashboard/crm/companies",
    label: "Companies",
    icon: "companies",
    matchPrefix: "/dashboard/crm/companies",
    feature: "full_crm",
  },
  {
    href: "/dashboard/crm/pipeline",
    label: "Pipeline",
    icon: "pipeline",
    matchPrefix: "/dashboard/crm/pipeline",
    feature: "full_crm",
  },
  {
    href: "/dashboard/crm/deals",
    label: "Deals",
    icon: "deals",
    matchPrefix: "/dashboard/crm/deals",
    feature: "full_crm",
  },
];

export const FOOTER_NAV: NavItem[] = [
  { href: "/billing", label: "Billing", icon: "billing" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
];

/** Routes warmed on dashboard load + sidebar hover for instant navigation */
export const DASHBOARD_PREFETCH_ROUTES = [
  "/dashboard",
  "/dashboard/inbox",
  "/dashboard/crm",
  "/dashboard/crm/contacts",
  "/dashboard/crm/companies",
  "/dashboard/crm/pipeline",
  "/dashboard/crm/deals",
  "/dashboard/tasks",
  "/dashboard/calendar",
  "/dashboard/meetings",
  "/dashboard/automations",
  "/dashboard/summary",
  "/dashboard/settings",
  "/dashboard/connect-gmail",
  "/dashboard/actions",
  "/billing",
] as const;

export const DASHBOARD_MOBILE_TITLES: Record<string, string> = {
  "/dashboard/inbox": "AI Inbox",
  "/dashboard/crm": "CRM",
  "/dashboard/tasks": "Tasks",
  "/dashboard/calendar": "Calendar",
  "/dashboard/automations": "Automations",
  "/dashboard/summary": "Analytics",
  "/dashboard/settings": "Settings",
  "/dashboard/connect-gmail": "Connect Gmail",
  "/dashboard/actions": "Actions",
};

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
