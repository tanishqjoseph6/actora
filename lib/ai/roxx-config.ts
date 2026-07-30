import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  FileText,
  Handshake,
  Inbox,
  ListTodo,
  Sparkles,
  Users,
} from "lucide-react";

export const ROXX_EXAMPLE_PROMPTS = [
  "Create a task for tomorrow",
  "Summarize today's meetings",
  "Draft a follow-up email",
  "Show overdue tasks",
  "Find Acme Corp conversations",
  "Create meeting notes",
  "Generate proposal",
  "Search workspace",
] as const;

export type RoxxPageContext =
  | "dashboard"
  | "tasks"
  | "crm"
  | "inbox"
  | "calendar"
  | "automations"
  | "analytics"
  | "settings";

export type ContextualAiAction = {
  id: string;
  label: string;
  prompt: string;
  icon: LucideIcon;
};

export const CONTEXTUAL_AI_ACTIONS: Record<RoxxPageContext, ContextualAiAction[]> = {
  dashboard: [
    {
      id: "summarize-day",
      label: "Summarize today",
      prompt: "Summarize my inbox, tasks, and meetings for today.",
      icon: Sparkles,
    },
    {
      id: "follow-ups",
      label: "Suggest follow-ups",
      prompt: "Suggest follow-ups I should send this week based on my workspace.",
      icon: Inbox,
    },
  ],
  tasks: [
    {
      id: "summarize",
      label: "Summarize",
      prompt: "Summarize my open tasks by priority and due date.",
      icon: Sparkles,
    },
    {
      id: "prioritize",
      label: "Prioritize",
      prompt: "Prioritize my open tasks and recommend what to tackle first today.",
      icon: ListTodo,
    },
    {
      id: "rewrite",
      label: "Rewrite",
      prompt: "Rewrite my highest-priority task titles to be clearer action items.",
      icon: FileText,
    },
  ],
  crm: [
    {
      id: "follow-up",
      label: "Generate follow-up",
      prompt: "Draft follow-up emails for my hottest CRM deals and stale contacts.",
      icon: Handshake,
    },
    {
      id: "score",
      label: "Score leads",
      prompt: "Score my recent CRM contacts by engagement and suggest next steps.",
      icon: Sparkles,
    },
    {
      id: "next-step",
      label: "Suggest next step",
      prompt: "Suggest the best next step for each open deal in my pipeline.",
      icon: Users,
    },
  ],
  inbox: [
    {
      id: "summarize",
      label: "Summarize inbox",
      prompt: "Summarize my unread emails and highlight what needs action today.",
      icon: Inbox,
    },
    {
      id: "draft",
      label: "Draft replies",
      prompt: "Draft concise follow-up replies for my most important unread threads.",
      icon: Sparkles,
    },
  ],
  calendar: [
    {
      id: "minutes",
      label: "Generate minutes",
      prompt: "Generate meeting minutes and action items from today's calendar events.",
      icon: FileText,
    },
    {
      id: "optimize",
      label: "Optimize schedule",
      prompt: "Review my calendar this week and suggest schedule optimizations.",
      icon: Calendar,
    },
    {
      id: "free-time",
      label: "Find free time",
      prompt: "Find the best 30-minute slots for a team sync this week.",
      icon: Calendar,
    },
  ],
  automations: [
    {
      id: "suggest",
      label: "Suggest automations",
      prompt: "Suggest 3 high-impact automations I should build for my workflow.",
      icon: Sparkles,
    },
  ],
  analytics: [
    {
      id: "insights",
      label: "Explain metrics",
      prompt: "Explain my workspace analytics and highlight trends worth acting on.",
      icon: Sparkles,
    },
  ],
  settings: [
    {
      id: "setup",
      label: "Setup checklist",
      prompt: "Review my workspace setup and list integrations I should connect next.",
      icon: Sparkles,
    },
  ],
};

export function resolvePageContext(pathname: string): RoxxPageContext {
  if (pathname.startsWith("/dashboard/tasks")) return "tasks";
  if (pathname.startsWith("/dashboard/crm")) return "crm";
  if (pathname.startsWith("/dashboard/inbox")) return "inbox";
  if (pathname.startsWith("/dashboard/calendar")) return "calendar";
  if (pathname.startsWith("/dashboard/automations")) return "automations";
  if (pathname.startsWith("/dashboard/summary")) return "analytics";
  if (pathname.startsWith("/dashboard/settings")) return "settings";
  return "dashboard";
}

export function filterPromptSuggestions(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...ROXX_EXAMPLE_PROMPTS];
  return ROXX_EXAMPLE_PROMPTS.filter((prompt) =>
    prompt.toLowerCase().includes(q)
  );
}
