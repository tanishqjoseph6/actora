import { blockToNode, getBlockById } from "./constants";
import type { AutomationTemplate, WorkflowNode } from "./types";

function nodes(...blockIds: string[]): WorkflowNode[] {
  return blockIds.map((id, index) => {
    const block = getBlockById(id);
    if (!block) throw new Error(`Unknown block: ${id}`);
    return blockToNode(block, `node-${id}-${index}`);
  });
}

/** Production recipe templates — shown in Templates gallery */
export const MOCK_TEMPLATES: AutomationTemplate[] = [
  {
    id: "tpl-gmail-crm",
    name: "Gmail → CRM",
    description:
      "When a new email arrives, extract the contact and create or update a CRM lead.",
    icon: "📧",
    category: "CRM",
    popularity: 99,
    nodes: nodes(
      "new-email",
      "extract-contact",
      "create-crm-lead",
      "update-crm",
      "notify-user"
    ),
  },
  {
    id: "tpl-gmail-tasks",
    name: "Gmail → Tasks",
    description:
      "Classify and prioritize inbox mail, then create a follow-up task automatically.",
    icon: "✅",
    category: "Productivity",
    popularity: 97,
    nodes: nodes(
      "new-email",
      "classify-email",
      "detect-priority",
      "create-task",
      "notify-user"
    ),
  },
  {
    id: "tpl-gmail-calendar",
    name: "Gmail → Calendar",
    description:
      "Summarize an email thread and book a Google Meet meeting with the sender.",
    icon: "📅",
    category: "Calendar",
    popularity: 95,
    nodes: nodes(
      "new-email",
      "summarize-email",
      "create-meeting",
      "notify-user"
    ),
  },
  {
    id: "tpl-gmail-ai-reply",
    name: "Gmail → AI Reply",
    description:
      "Draft a contextual AI reply for new emails and send when published.",
    icon: "✨",
    category: "Inbox",
    popularity: 98,
    nodes: nodes("new-email", "generate-reply", "send-email", "log-activity"),
  },
  {
    id: "tpl-lead-deal",
    name: "Lead → Deal",
    description:
      "When a CRM lead is created, open a pipeline deal and log the activity.",
    icon: "💼",
    category: "Sales",
    popularity: 96,
    nodes: nodes(
      "new-lead",
      "extract-contact",
      "create-deal",
      "update-crm",
      "notify-user"
    ),
  },
  {
    id: "tpl-meeting-followup",
    name: "Meeting → Follow-up",
    description:
      "After a meeting is created, generate a follow-up and create a task.",
    icon: "🔄",
    category: "Productivity",
    popularity: 94,
    nodes: nodes(
      "meeting-created",
      "generate-followup",
      "create-task",
      "notify-user",
      "log-activity"
    ),
  },
];
