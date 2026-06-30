import type { WorkflowNode } from "./types";

export const MOCK_PAYLOADS: Record<string, Record<string, unknown>> = {
  "new-email": {
    from: "sarah@acmecorp.com",
    subject: "Interested in enterprise plan",
    body: "Hi, we'd like to schedule a demo for our team of 50.",
    unread: true,
  },
  "new-lead": {
    name: "Nova Systems",
    email: "contact@novasystems.io",
    source: "website",
    score: 82,
  },
  "meeting-created": {
    title: "Product Demo",
    attendees: ["sarah@acmecorp.com"],
    startTime: "2026-06-28T14:00:00Z",
  },
  "task-due": {
    taskId: "task-442",
    title: "Follow up with Acme Corp",
    dueAt: "2026-06-27T17:00:00Z",
  },
  "invoice-paid": {
    invoiceId: "INV-2026-0892",
    amount: 4999,
    currency: "USD",
    customer: "Acme Corp",
  },
  "manual-trigger": {
    initiatedBy: "Tanishq",
    note: "Manual test run",
  },
};

export function getMockPayloadForTrigger(triggerBlockId: string | null): Record<string, unknown> {
  if (triggerBlockId && MOCK_PAYLOADS[triggerBlockId]) {
    return MOCK_PAYLOADS[triggerBlockId];
  }
  return MOCK_PAYLOADS["manual-trigger"];
}

export function simulateStepOutput(
  node: WorkflowNode,
  input: Record<string, unknown>
): Record<string, unknown> {
  switch (node.blockId) {
    case "summarize-email":
      return {
        summary: "Lead interested in enterprise demo for 50 users.",
        sentiment: "positive",
      };
    case "generate-reply":
      return {
        draft: "Thanks for reaching out! I'd love to schedule a demo this week.",
      };
    case "extract-contact":
      return {
        name: input.name ?? "Sarah Chen",
        email: input.from ?? input.email ?? "sarah@acmecorp.com",
        company: "Acme Corp",
      };
    case "create-crm-lead":
      return { leadId: "lead-mock-001", stage: "qualified" };
    case "classify-email":
      return { category: "sales", confidence: 0.94 };
    case "detect-priority":
      return { priority: "high", score: 87 };
    case "generate-followup":
      return { followUpAt: "2026-06-29T10:00:00Z", channel: "email" };
    case "condition":
      return { branch: "true", matched: true };
    case "send-email":
      return { sent: true, messageId: "msg-mock-001" };
    case "create-task":
      return { taskId: "task-mock-992", title: "Follow up: enterprise demo" };
    case "update-crm":
      return { updated: true, recordId: "deal-mock-44" };
    case "notify-user":
      return { notified: true, channel: "in-app" };
    case "create-meeting":
      return { eventId: "cal-mock-771", scheduled: true };
    case "log-activity":
      return { logged: true, activityId: "act-mock-331" };
    case "slack-whatsapp":
      return { delivered: true, channel: "slack" };
    default:
      if (node.category === "trigger") {
        return { triggered: true, payload: input };
      }
      return { ok: true };
  }
}
