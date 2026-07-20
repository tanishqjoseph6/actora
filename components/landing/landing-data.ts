export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Blog", href: "#blog" },
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
      { label: "Features", href: "#features" },
      { label: "AI Inbox", href: "#features" },
      { label: "CRM", href: "#features" },
      { label: "Tasks", href: "#features" },
      { label: "Meetings", href: "#features" },
      { label: "Automations", href: "#product" },
    ],
  },
  {
    id: "resources",
    label: "Resources",
    links: [
      { label: "Blog", href: "#blog" },
      { label: "Changelog", href: "#blog" },
      { label: "Roadmap", href: "#blog" },
      { label: "Documentation", href: "#faq" },
    ],
  },
  {
    id: "company",
    label: "Company",
    links: [
      { label: "About", href: "#blog" },
      { label: "Contact", href: "mailto:sales@useactora.com" },
      { label: "Careers", href: "#blog" },
    ],
  },
];

export const MENU_FLAT_LINKS: MenuLink[] = [
  { label: "Pricing", href: "#pricing" },
  { label: "Security", href: "#faq" },
];

export const FEATURES = [
  {
    title: "AI Inbox",
    description:
      "Summaries, smart replies, and priority signals so every email moves work forward.",
    icon: "inbox" as const,
  },
  {
    title: "AI CRM",
    description:
      "Contacts, companies, and pipeline updated automatically from conversation context.",
    icon: "crm" as const,
  },
  {
    title: "AI Tasks",
    description:
      "Turn commitments into tracked tasks with owners, due dates, and follow-through.",
    icon: "tasks" as const,
  },
  {
    title: "Meetings",
    description:
      "Schedule, prep, and capture next steps without leaving your workspace.",
    icon: "meetings" as const,
  },
  {
    title: "Automations",
    description:
      "Build workflows that run follow-ups, updates, and handoffs on autopilot.",
    icon: "automations" as const,
  },
  {
    title: "AI Assistant",
    description:
      "Ask Actora to draft, research, and execute across inbox, CRM, and tasks.",
    icon: "assistant" as const,
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
  {
    title: "Manual Workflow vs AI Workflow",
    left: "Copy, paste, remember",
    right: "Analyze, act, complete",
    points: [
      { traditional: "Follow-ups fall through", actora: "Automated follow-ups" },
      { traditional: "Tribal process knowledge", actora: "Repeatable automations" },
      { traditional: "Hours of admin work", actora: "Minutes of review" },
    ],
  },
  {
    title: "Linear Workflow vs Actora Workflow",
    left: "Planning-first project management",
    right: "Conversation-first execution",
    points: [
      {
        traditional: "Manual issue creation",
        actora: "AI creates tasks from emails",
      },
      {
        traditional: "Context copied manually",
        actora: "Context captured automatically",
      },
      {
        traditional: "Multiple app switching",
        actora: "Inbox, CRM & Tasks together",
      },
      {
        traditional: "Work starts after planning",
        actora: "Work starts from conversations",
      },
    ],
  },
] as const;

export const TRUSTED_COMPANIES = [
  "Northline",
  "Stackform",
  "Meridian",
  "Orbit Labs",
  "Plainfield",
  "Cascade",
] as const;

export const LANDING_FAQ = [
  {
    question: "Do I need a credit card to start?",
    answer:
      "No. Start a free 14-day trial with full product access. Upgrade only when you're ready.",
  },
  {
    question: "How does Actora connect to Gmail?",
    answer:
      "Secure Google OAuth. You connect your inbox in a few clicks — we never store your password.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Sessions are encrypted, access is OAuth-based, and enterprise controls are available as you scale.",
  },
  {
    question: "Can I switch plans later?",
    answer:
      "Yes. Upgrade or change billing from the Billing page anytime. Downgrades apply at renewal.",
  },
  {
    question: "Who is Actora built for?",
    answer:
      "Operators, founders, and revenue teams who live in email and need conversations to become execution.",
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
