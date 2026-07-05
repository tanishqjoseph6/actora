export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Product", href: "#product" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
] as const;

export const FEATURES = [
  {
    title: "Unified workspace",
    description: "Email, CRM, and automations in one calm interface built for operators.",
    icon: "◈",
  },
  {
    title: "AI that takes action",
    description: "Draft replies, schedule meetings, and follow up without switching tabs.",
    icon: "⚡",
  },
  {
    title: "Pipeline visibility",
    description: "Track deals, contacts, and companies with context from every conversation.",
    icon: "◎",
  },
  {
    title: "Team-ready",
    description: "Shared inboxes, roles, and analytics when your team outgrows solo mode.",
    icon: "⬡",
  },
  {
    title: "Secure by default",
    description: "Google OAuth, encrypted sessions, and enterprise controls when you need them.",
    icon: "⛨",
  },
  {
    title: "Fast onboarding",
    description: "Connect Gmail in minutes and start with templates—not a six-week rollout.",
    icon: "→",
  },
] as const;

export const PRODUCT_SECTIONS = [
  {
    id: "crm",
    badge: "CRM",
    title: "Relationships with full context",
    description:
      "Contacts, companies, deals, and pipeline—linked to the emails that matter. No more copying details between tools.",
    bullets: [
      "Contact & company profiles",
      "Deal pipeline board",
      "AI lead scoring",
      "Activity from inbox sync",
    ],
    visual: "crm" as const,
  },
  {
    id: "inbox",
    badge: "AI Inbox",
    title: "Inbox that understands intent",
    description:
      "Actora reads, summarizes, and suggests replies so you respond in seconds—not hours.",
    bullets: [
      "AI summaries on every thread",
      "One-click smart replies",
      "Priority & unread signals",
      "Unlimited accounts on Pro",
    ],
    visual: "inbox" as const,
  },
  {
    id: "automations",
    badge: "Automations",
    title: "Workflows that run themselves",
    description:
      "Trigger actions from email events, schedule follow-ups, and standardize how your team operates.",
    bullets: [
      "Visual workflow builder",
      "Templates to start fast",
      "Pause, test & version history",
      "Runs with full audit logs",
    ],
    visual: "automations" as const,
  },
  {
    id: "analytics",
    badge: "Analytics",
    title: "Clarity across your operation",
    description:
      "See usage, pipeline health, and team performance in dashboards designed for decisions—not decoration.",
    bullets: [
      "Workspace metrics",
      "AI action tracking",
      "Team analytics on Team plan",
      "Export-ready summaries",
    ],
    visual: "analytics" as const,
  },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "Actora replaced three tools for our sales team. The inbox + CRM combo alone saved us ten hours a week.",
    name: "Sarah Chen",
    role: "Head of Revenue, Northline",
  },
  {
    quote:
      "We finally have a system that drafts replies I'd actually send. It feels like Linear met Gmail.",
    name: "Marcus Webb",
    role: "Founder, Stackform",
  },
  {
    quote:
      "Onboarding was painless—connect Gmail, invite the team, and automations were live the same day.",
    name: "Priya Nair",
    role: "Ops Lead, Meridian Labs",
  },
] as const;

export const FOOTER_LINKS = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  company: [
    { label: "Billing", href: "/billing" },
    { label: "Sign up", href: "/signup" },
    { label: "Log in", href: "/login" },
  ],
} as const;
