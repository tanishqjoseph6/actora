import { blockToNode, getBlockById } from "./constants";
import type { AutomationTemplate, WorkflowNode } from "./types";

function nodes(...blockIds: string[]): WorkflowNode[] {
  return blockIds.map((id, index) => {
    const block = getBlockById(id);
    if (!block) throw new Error(`Unknown block: ${id}`);
    return blockToNode(block, `node-${id}-${index}`);
  });
}

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
