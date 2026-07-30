export type DemoStepId =
  | "welcome"
  | "inbox"
  | "crm"
  | "tasks"
  | "calendar"
  | "documents"
  | "automations"
  | "roxx"
  | "analytics"
  | "ending";

export type DemoStep = {
  id: DemoStepId;
  title: string;
  tooltip: string;
  /** Auto-advance duration in ms (ending step does not auto-advance). */
  durationMs: number;
  sidebarHighlight?: string;
};

export const DEMO_STEPS: DemoStep[] = [
  {
    id: "welcome",
    title: "Welcome Dashboard",
    tooltip: "Welcome to your AI workspace.",
    durationMs: 7000,
    sidebarHighlight: "Dashboard",
  },
  {
    id: "inbox",
    title: "AI Inbox",
    tooltip: "AI organizes your inbox automatically.",
    durationMs: 8000,
    sidebarHighlight: "Inbox",
  },
  {
    id: "crm",
    title: "CRM",
    tooltip: "Every conversation stays connected.",
    durationMs: 7500,
    sidebarHighlight: "CRM",
  },
  {
    id: "tasks",
    title: "Tasks",
    tooltip: "Turn conversations into action.",
    durationMs: 7500,
    sidebarHighlight: "Tasks",
  },
  {
    id: "calendar",
    title: "Calendar",
    tooltip: "Scheduling happens automatically.",
    durationMs: 7000,
    sidebarHighlight: "Meetings",
  },
  {
    id: "documents",
    title: "Documents",
    tooltip: "Create documents in seconds.",
    durationMs: 7500,
    sidebarHighlight: "Documents",
  },
  {
    id: "automations",
    title: "Automations",
    tooltip: "Workflows run while you focus on what matters.",
    durationMs: 9000,
    sidebarHighlight: "Automations",
  },
  {
    id: "roxx",
    title: "Roxx AI",
    tooltip: "Your AI copilot executes across the entire workspace.",
    durationMs: 10000,
    sidebarHighlight: "Roxx AI",
  },
  {
    id: "analytics",
    title: "Analytics",
    tooltip: "See team performance at a glance.",
    durationMs: 8000,
    sidebarHighlight: "Analytics",
  },
  {
    id: "ending",
    title: "Get started",
    tooltip: "Where conversations become execution.",
    durationMs: 0,
  },
];

export const DEMO_TOTAL_STEPS = DEMO_STEPS.length;

export const SIDEBAR_ITEMS = [
  "Dashboard",
  "Inbox",
  "CRM",
  "Tasks",
  "Meetings",
  "Documents",
  "Automations",
  "Roxx AI",
  "Analytics",
] as const;
