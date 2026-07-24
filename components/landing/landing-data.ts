export const NAV_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
] as const;

export type MenuLink = { label: string; href: string };

export type MenuGroup = {
  id: string;
  label: string;
  links: MenuLink[];
};

export const MENU_GROUPS: MenuGroup[] = [
  {
    id: "product",
    label: "Product",
    links: [
      { label: "All features", href: "/features" },
      { label: "AI Inbox", href: "/features#ai-inbox" },
      { label: "Roxx AI", href: "/features#roxx-ai" },
      { label: "CRM", href: "/features#crm" },
      { label: "Calendar", href: "/features#calendar" },
      { label: "Tasks", href: "/features#tasks" },
      { label: "Automations", href: "/features#automations" },
      { label: "Analytics", href: "/features#analytics" },
      { label: "Team Workspace", href: "/features#team-workspace" },
    ],
  },
  {
    id: "resources",
    label: "Resources",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Pricing", href: "/pricing" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Refund Policy", href: "/terms#refund-policy" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
  {
    id: "company",
    label: "Company",
    links: [
      { label: "Contact sales", href: "/contact" },
      { label: "Book a demo", href: "mailto:sales@useactora.com?subject=Actora%20Demo" },
      { label: "Sign up", href: "/signup" },
      { label: "Log in", href: "/login" },
    ],
  },
];

export const MENU_FLAT_LINKS: MenuLink[] = [
  { label: "Pricing", href: "/pricing" },
  { label: "Security", href: "/faq#security" },
];

export const FEATURES = [
  {
    id: "ai-inbox",
    title: "AI Inbox",
    description:
      "Summaries, smart replies, and priority signals so every email moves work forward.",
    detail:
      "Triage faster with AI-generated summaries, suggested replies, and urgency cues — without leaving Gmail context.",
    icon: "inbox" as const,
  },
  {
    id: "roxx-ai",
    title: "Roxx AI",
    description:
      "Ask Roxx to draft, research, and execute across inbox, CRM, calendar, and tasks.",
    detail:
      "Your execution copilot. Roxx understands workspace context and turns intent into concrete actions.",
    icon: "assistant" as const,
  },
  {
    id: "crm",
    title: "CRM",
    description:
      "Contacts, companies, and pipeline updated automatically from conversation context.",
    detail:
      "Stop re-entering data. Deals and contacts stay current as conversations happen.",
    icon: "crm" as const,
  },
  {
    id: "calendar",
    title: "Calendar",
    description:
      "Schedule, prep, and capture next steps without leaving your workspace.",
    detail:
      "Meetings connected to threads, contacts, and follow-ups — so prep and next steps are automatic.",
    icon: "meetings" as const,
  },
  {
    id: "tasks",
    title: "Tasks",
    description:
      "Turn commitments into tracked tasks with owners, due dates, and follow-through.",
    detail:
      "Promises in email become owned work items — nothing falls through the cracks.",
    icon: "tasks" as const,
  },
  {
    id: "automations",
    title: "Automations",
    description:
      "Build workflows that run follow-ups, updates, and handoffs on autopilot.",
    detail:
      "Design repeatable loops once. Actora runs them whenever the right conversation arrives.",
    icon: "automations" as const,
  },
  {
    id: "analytics",
    title: "Analytics",
    description:
      "See inbox health, CRM momentum, and AI usage across your workspace in one view.",
    detail:
      "Operator-grade analytics that show whether conversations are becoming outcomes.",
    icon: "analytics" as const,
  },
  {
    id: "team-workspace",
    title: "Team Workspace",
    description:
      "Invite teammates, assign roles, and share AI credits under one workspace plan.",
    detail:
      "Owners, admins, members, and viewers — with billing and credits scoped to the workspace.",
    icon: "workspace" as const,
  },
] as const;

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Connect your inbox",
    description:
      "Secure Google OAuth in minutes. Actora never stores your password.",
  },
  {
    step: 2,
    title: "Organize everything with AI",
    description:
      "Summaries, CRM updates, tasks, and calendar context appear automatically.",
  },
  {
    step: 3,
    title: "Let Roxx AI execute work",
    description:
      "Ask Roxx to draft, schedule, follow up, and close the loop — from one place.",
  },
] as const;

export const WORKFLOW_STEPS = [
  { label: "Email", description: "New conversation arrives" },
  { label: "AI Analysis", description: "Intent & entities extracted" },
  { label: "CRM", description: "Record updated in context" },
  { label: "Task", description: "Action item created" },
  { label: "Follow-up", description: "Reminder scheduled" },
  { label: "Completed", description: "Loop closed" },
] as const;

export const COMPARISONS = [
  {
    title: "Gmail vs Actora",
    left: "Inbox for reading mail",
    right: "Inbox that executes work",
    points: [
      { traditional: "Manual triage & replies", actora: "AI summaries & smart replies" },
      { traditional: "No CRM context", actora: "Deals & contacts linked to threads" },
      { traditional: "Tasks live elsewhere", actora: "Tasks created from email" },
    ],
  },
  {
    title: "HubSpot vs Actora",
    left: "CRM-first sales suite",
    right: "Conversation-first execution",
    points: [
      { traditional: "Heavy setup & seats", actora: "Start from Gmail in minutes" },
      { traditional: "Email bolted on", actora: "AI Inbox at the center" },
      { traditional: "Complex for operators", actora: "Built for daily execution" },
    ],
  },
  {
    title: "Traditional CRM vs Actora",
    left: "Data entry driven",
    right: "Conversation driven",
    points: [
      { traditional: "Update records by hand", actora: "CRM updates from emails" },
      { traditional: "Stale pipeline data", actora: "Live context from every thread" },
      { traditional: "Separate inbox tools", actora: "One workspace for ops" },
    ],
  },
] as const;

/** Actora vs Linear feature comparison (landing table). */
export const LINEAR_COMPARISON_ROWS = [
  { feature: "AI Email Inbox", actora: "yes", linear: "no" },
  { feature: "AI Email Reply", actora: "yes", linear: "no" },
  { feature: "AI Meeting Assistant", actora: "yes", linear: "no" },
  { feature: "AI Task Creation", actora: "yes", linear: "partial" },
  { feature: "AI CRM", actora: "yes", linear: "no" },
  { feature: "Calendar Integration", actora: "yes", linear: "partial" },
  { feature: "Daily AI Summary", actora: "yes", linear: "no" },
  { feature: "Gmail & Outlook Integration", actora: "yes", linear: "no" },
  { feature: "AI Workflow Automation", actora: "yes", linear: "no" },
  { feature: "Team Workspace", actora: "yes", linear: "yes" },
  { feature: "Project Management", actora: "yes", linear: "yes" },
  { feature: "Analytics Dashboard", actora: "yes", linear: "partial" },
  { feature: "Built-in Billing", actora: "yes", linear: "no" },
  { feature: "AI Credits System", actora: "yes", linear: "no" },
] as const;

export type ComparisonCellValue = "yes" | "no" | "partial";

export const TRUSTED_SEGMENTS = [
  "Revenue Ops",
  "Founders",
  "B2B SaaS",
  "Agencies",
  "Consultancies",
  "Sales Teams",
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "Actora finally made our inbox feel like an operating system. Emails stop being noise and start becoming work.",
    role: "Head of Revenue Ops",
    segment: "B2B SaaS team",
  },
  {
    quote:
      "Roxx drafts the reply, updates the deal, and creates the follow-up before I’ve finished reading the thread.",
    role: "Founder",
    segment: "Early-stage startup",
  },
  {
    quote:
      "We replaced three tools with one workspace. The team actually uses it every day.",
    role: "COO",
    segment: "Services company",
  },
] as const;

export const LANDING_FAQ = [
  {
    id: "security",
    question: "Is my data secure?",
    answer:
      "Yes. Actora uses encrypted sessions, Google OAuth (we never store your password), and workspace-scoped access controls. Enterprise-ready controls are available as you scale.",
  },
  {
    id: "ai-credits",
    question: "How do AI credits work?",
    answer:
      "Credits belong to your workspace. Free includes 100 credits per month, Pro includes 1,000, and Team workspaces share 5,000 per month. Purchased top-ups stack on top of your monthly allotment and follow our existing credit policy. Every member consumes from the shared workspace pool.",
  },
  {
    id: "billing",
    question: "How does billing work?",
    answer:
      "Billing is workspace-level. Owners manage subscriptions, credit packs, invoices, and payment history. Start with a free 14-day trial — no credit card required.",
  },
  {
    id: "team",
    question: "How do team plans and roles work?",
    answer:
      "Invite teammates by email. Roles include Owner, Admin, Member, and Viewer — with permissions for CRM, Inbox, Automations, billing, and more enforced on the server.",
  },
  {
    id: "privacy",
    question: "What about data privacy?",
    answer:
      "We process inbox and CRM data only to deliver product features you enable. See our Privacy Policy and Cookie Policy for retention, subprocessors, cookies, and your rights.",
  },
  {
    id: "trial",
    question: "Do I need a credit card to start?",
    answer:
      "No. Start a free 14-day trial with full product access. Upgrade only when you're ready.",
  },
  {
    id: "gmail",
    question: "How does Actora connect to Gmail?",
    answer:
      "Secure Google OAuth. You connect your inbox in a few clicks — we never store your password.",
  },
  {
    id: "plans",
    question: "Can I switch plans later?",
    answer:
      "Yes. Upgrade or change billing from Billing anytime. Downgrades apply at the next renewal.",
  },
] as const;

export const FOOTER_LINKS = {
  product: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "FAQ", href: "/faq" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  company: [
    { label: "Contact", href: "/contact" },
    { label: "Sign up", href: "/signup" },
    { label: "Log in", href: "/login" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Refund Policy", href: "/terms#refund-policy" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
  social: [
    { label: "X / Twitter", href: "https://twitter.com/useactora", external: true },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/actora", external: true },
    { label: "Instagram", href: "https://instagram.com/useactora", external: true },
  ],
} as const;
