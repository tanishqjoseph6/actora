import type { BlockDefinition } from "./types";

export const TRIGGER_BLOCKS: BlockDefinition[] = [
  { id: "new-email", category: "trigger", label: "New Email", description: "When a new email arrives", icon: "📧" },
  { id: "new-lead", category: "trigger", label: "New Lead", description: "When a CRM lead is created", icon: "🎯" },
  { id: "meeting-created", category: "trigger", label: "Meeting Created", description: "When a calendar event is added", icon: "📅" },
  { id: "task-due", category: "trigger", label: "Task Due", description: "When a task reaches its due date", icon: "⏰" },
  { id: "invoice-paid", category: "trigger", label: "Invoice Paid", description: "When payment is received", icon: "💳" },
  { id: "manual-trigger", category: "trigger", label: "Manual Trigger", description: "Run on demand", icon: "▶️" },
];

export const CONDITION_BLOCK: BlockDefinition = {
  id: "condition",
  category: "condition",
  label: "Condition",
  description: "Branch on rules or AI classification",
  icon: "◇",
};

export const AI_ACTION_BLOCKS: BlockDefinition[] = [
  { id: "summarize-email", category: "ai", label: "Summarize Email", description: "AI summary of thread content", icon: "📝" },
  { id: "generate-reply", category: "ai", label: "Generate Reply", description: "Draft a contextual reply", icon: "✨" },
  { id: "extract-contact", category: "ai", label: "Extract Contact", description: "Pull contact details from text", icon: "👤" },
  { id: "create-crm-lead", category: "ai", label: "Create CRM Lead", description: "Enrich and create a lead", icon: "🏢" },
  { id: "create-deal", category: "ai", label: "Create Deal", description: "Open a pipeline deal from a lead", icon: "💼" },
  { id: "classify-email", category: "ai", label: "Classify Email", description: "Categorize by intent", icon: "🏷️" },
  { id: "detect-priority", category: "ai", label: "Detect Priority", description: "Score urgency with AI", icon: "🔥" },
  { id: "generate-followup", category: "ai", label: "Generate Follow-up", description: "Schedule smart follow-ups", icon: "🔄" },
];

export const OUTPUT_BLOCKS: BlockDefinition[] = [
  { id: "send-email", category: "output", label: "Send Email", description: "Send via connected inbox", icon: "📤" },
  { id: "create-task", category: "output", label: "Create Task", description: "Add to task list", icon: "✅" },
  { id: "update-crm", category: "output", label: "Update CRM", description: "Sync deal or contact", icon: "📊" },
  { id: "notify-user", category: "output", label: "Notify User", description: "In-app or push alert", icon: "🔔" },
  { id: "create-meeting", category: "output", label: "Create Meeting", description: "Book calendar slot", icon: "📆" },
  { id: "log-activity", category: "output", label: "Log Activity", description: "Record in activity feed", icon: "📋" },
  { id: "slack-whatsapp", category: "output", label: "Slack / WhatsApp", description: "Message a channel or contact", icon: "💬" },
];

export const ALL_BLOCKS: BlockDefinition[] = [
  ...TRIGGER_BLOCKS,
  CONDITION_BLOCK,
  ...AI_ACTION_BLOCKS,
  ...OUTPUT_BLOCKS,
];

export function getBlockById(id: string): BlockDefinition | undefined {
  return ALL_BLOCKS.find((b) => b.id === id);
}

export function blockToNode(block: BlockDefinition, nodeId?: string) {
  return {
    id: nodeId ?? `node-${block.id}-${Date.now()}`,
    blockId: block.id,
    category: block.category,
    label: block.label,
    icon: block.icon,
  };
}
