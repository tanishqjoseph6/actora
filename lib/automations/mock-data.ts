import { blockToNode, getBlockById } from "./constants";
import type {
  Automation,
  AutomationMetrics,
  AutomationRun,
  AutomationTemplate,
  WorkflowNode,
} from "./types";

function nodes(...blockIds: string[]): WorkflowNode[] {
  return blockIds.map((id, index) => {
    const block = getBlockById(id);
    if (!block) throw new Error(`Unknown block: ${id}`);
    return blockToNode(block, `node-${id}-${index}`);
  });
}

export const MOCK_METRICS: AutomationMetrics = {
  activeAutomations: 4,
  todayRuns: 127,
  successRate: 98.4,
  timeSavedHours: 12.5,
};

export const MOCK_AUTOMATIONS: Automation[] = [
  {
    id: "auto-1",
    name: "Lead Follow-up Sequence",
    description: "Auto-reply and CRM update when a new lead emails in",
    status: "active",
    lastRun: "4 min ago",
    runsToday: 18,
    successRate: 99.2,
    createdBy: "Tanishq",
    executionTimeMs: 1240,
    updatedAt: "2026-06-25",
    templateId: "tpl-lead-followup",
    nodes: nodes("new-email", "classify-email", "generate-reply", "send-email", "update-crm"),
  },
  {
    id: "auto-2",
    name: "Support Ticket Triage",
    description: "Classify, prioritize, and route support emails",
    status: "active",
    lastRun: "12 min ago",
    runsToday: 34,
    successRate: 97.8,
    createdBy: "Tanishq",
    executionTimeMs: 890,
    updatedAt: "2026-06-20",
    templateId: "tpl-email-triage",
    nodes: nodes("new-email", "summarize-email", "detect-priority", "create-task", "notify-user"),
  },
  {
    id: "auto-3",
    name: "Invoice Payment Alert",
    description: "Notify sales when invoices are paid",
    status: "paused",
    lastRun: "2 days ago",
    runsToday: 0,
    successRate: 100,
    createdBy: "Tanishq",
    executionTimeMs: 420,
    updatedAt: "2026-06-15",
    templateId: "tpl-invoice-reminder",
    nodes: nodes("invoice-paid", "notify-user", "update-crm", "log-activity"),
  },
  {
    id: "auto-4",
    name: "Meeting Prep Assistant",
    description: "Summarize context before every meeting",
    status: "active",
    lastRun: "1 hr ago",
    runsToday: 6,
    successRate: 96.5,
    createdBy: "Tanishq",
    executionTimeMs: 2100,
    updatedAt: "2026-06-22",
    templateId: "tpl-meeting-scheduler",
    nodes: nodes("meeting-created", "summarize-email", "generate-followup", "create-meeting"),
  },
];

export const MOCK_DRAFTS: Automation[] = [
  {
    id: "draft-1",
    name: "Sales Outreach Draft",
    description: "Unfinished outreach workflow",
    status: "draft",
    lastRun: "Never",
    runsToday: 0,
    successRate: 0,
    createdBy: "Tanishq",
    executionTimeMs: 0,
    updatedAt: "2026-06-26",
    nodes: nodes("new-lead", "generate-reply", "send-email"),
  },
  {
    id: "draft-2",
    name: "WhatsApp Escalation",
    description: "Route urgent threads to WhatsApp",
    status: "draft",
    lastRun: "Never",
    runsToday: 0,
    successRate: 0,
    createdBy: "Tanishq",
    executionTimeMs: 0,
    updatedAt: "2026-06-27",
    nodes: nodes("new-email", "detect-priority", "condition", "slack-whatsapp"),
  },
];

export const MOCK_TEMPLATES: AutomationTemplate[] = [
  {
    id: "tpl-lead-followup",
    name: "Lead Follow-up",
    description: "Instantly engage new leads with AI replies and CRM sync",
    icon: "🎯",
    category: "Sales",
    popularity: 98,
    nodes: nodes("new-email", "classify-email", "generate-reply", "send-email", "update-crm"),
  },
  {
    id: "tpl-customer-support",
    name: "Customer Support",
    description: "Triage tickets, summarize issues, and assign tasks",
    icon: "🛟",
    category: "Support",
    popularity: 94,
    nodes: nodes("new-email", "summarize-email", "detect-priority", "create-task", "notify-user"),
  },
  {
    id: "tpl-invoice-reminder",
    name: "Invoice Reminder",
    description: "Follow up on unpaid invoices and log outcomes",
    icon: "💳",
    category: "Finance",
    popularity: 87,
    nodes: nodes("invoice-paid", "notify-user", "update-crm", "log-activity"),
  },
  {
    id: "tpl-meeting-scheduler",
    name: "Meeting Scheduler",
    description: "Prep meetings with AI summaries and calendar blocks",
    icon: "📅",
    category: "Productivity",
    popularity: 91,
    nodes: nodes("meeting-created", "summarize-email", "generate-followup", "create-meeting"),
  },
  {
    id: "tpl-email-triage",
    name: "Email Triage",
    description: "Classify inbox, detect priority, and route automatically",
    icon: "📥",
    category: "Inbox",
    popularity: 96,
    nodes: nodes("new-email", "classify-email", "detect-priority", "condition", "create-task"),
  },
  {
    id: "tpl-sales-outreach",
    name: "Sales Outreach",
    description: "Personalized outreach sequences powered by AI",
    icon: "🚀",
    category: "Sales",
    popularity: 89,
    nodes: nodes("new-lead", "extract-contact", "generate-reply", "send-email", "log-activity"),
  },
];

export const MOCK_HISTORY: AutomationRun[] = [
  { id: "run-1", automationId: "auto-1", automationName: "Lead Follow-up Sequence", status: "success", startedAt: "4 min ago", durationMs: 1180, trigger: "New Email" },
  { id: "run-2", automationId: "auto-2", automationName: "Support Ticket Triage", status: "success", startedAt: "12 min ago", durationMs: 920, trigger: "New Email" },
  { id: "run-3", automationId: "auto-2", automationName: "Support Ticket Triage", status: "success", startedAt: "28 min ago", durationMs: 870, trigger: "New Email" },
  { id: "run-4", automationId: "auto-4", automationName: "Meeting Prep Assistant", status: "success", startedAt: "1 hr ago", durationMs: 2050, trigger: "Meeting Created" },
  { id: "run-5", automationId: "auto-1", automationName: "Lead Follow-up Sequence", status: "failed", startedAt: "2 hr ago", durationMs: 340, trigger: "New Email" },
  { id: "run-6", automationId: "auto-2", automationName: "Support Ticket Triage", status: "success", startedAt: "3 hr ago", durationMs: 910, trigger: "New Email" },
  { id: "run-7", automationId: "auto-4", automationName: "Meeting Prep Assistant", status: "skipped", startedAt: "5 hr ago", durationMs: 0, trigger: "Meeting Created" },
];

export const DEFAULT_CANVAS_NODES = MOCK_TEMPLATES[0].nodes;
