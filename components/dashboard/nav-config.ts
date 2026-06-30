export type NavItem = {
  href: string;
  label: string;
  icon: string;
  /** Prefix match for nested routes (e.g. /dashboard/crm) */
  matchPrefix?: string;
  /** Only highlight when pathname matches href exactly */
  exact?: boolean;
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

export const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Inbox", icon: "📥" },
  { href: "/dashboard/actions", label: "Actions", icon: "⚡" },
  { href: "/dashboard/meetings", label: "Meetings", icon: "📅" },
  { href: "/dashboard/tasks", label: "Tasks", icon: "📝" },
  { href: "/dashboard/summary", label: "Analytics", icon: "📊" },
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
  },
  {
    href: "/dashboard/crm/pipeline",
    label: "Pipeline",
    icon: "📊",
    matchPrefix: "/dashboard/crm/pipeline",
  },
  {
    href: "/dashboard/crm/deals",
    label: "Deals",
    icon: "💼",
    matchPrefix: "/dashboard/crm/deals",
  },
];

export const FOOTER_NAV: NavItem[] = [
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export const CRM_TABS = [
  { href: "/dashboard/crm", label: "Overview", icon: "✨" },
  ...CRM_NAV.filter((item) => item.href !== "/dashboard/crm").map(({ href, label, icon }) => ({
    href,
    label,
    icon,
  })),
];
