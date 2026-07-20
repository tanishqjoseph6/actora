import { blockToNode, getBlockById } from "./constants";
import type { CreateWorkflowInput, WorkflowMetadata } from "./types";

export type SampleWorkflowDef = {
  seedId: string;
  name: string;
  description: string;
  blockIds: string[];
  publish: boolean;
};

/** Seeded into every new workspace (idempotent via seedId metadata). */
export const SAMPLE_WORKFLOW_DEFS: SampleWorkflowDef[] = [
  {
    seedId: "sample-gmail-crm",
    name: "Gmail → CRM",
    description:
      "Extract contacts from new emails and sync them into your CRM.",
    blockIds: [
      "new-email",
      "extract-contact",
      "create-crm-lead",
      "update-crm",
      "notify-user",
    ],
    publish: false,
  },
  {
    seedId: "sample-gmail-tasks",
    name: "Gmail → Tasks",
    description: "Turn prioritized emails into actionable tasks.",
    blockIds: [
      "new-email",
      "classify-email",
      "detect-priority",
      "create-task",
      "notify-user",
    ],
    publish: false,
  },
  {
    seedId: "sample-gmail-calendar",
    name: "Gmail → Calendar",
    description: "Summarize emails and schedule Meet follow-ups.",
    blockIds: ["new-email", "summarize-email", "create-meeting", "notify-user"],
    publish: false,
  },
  {
    seedId: "sample-gmail-ai-reply",
    name: "Gmail → AI Reply",
    description:
      "When a new email arrives, generate an AI reply and send it automatically.",
    blockIds: ["new-email", "generate-reply", "send-email", "log-activity"],
    publish: false,
  },
  {
    seedId: "sample-lead-deal",
    name: "Lead → Deal",
    description: "Convert new CRM leads into pipeline deals.",
    blockIds: [
      "new-lead",
      "extract-contact",
      "create-deal",
      "update-crm",
      "notify-user",
    ],
    publish: false,
  },
  {
    seedId: "sample-meeting-followup",
    name: "Meeting → Follow-up",
    description: "Create follow-up tasks after meetings are booked.",
    blockIds: [
      "meeting-created",
      "generate-followup",
      "create-task",
      "notify-user",
      "log-activity",
    ],
    publish: false,
  },
];

export function buildSampleWorkflowInput(
  def: SampleWorkflowDef
): CreateWorkflowInput {
  const nodes = def.blockIds.map((blockId, index) => {
    const block = getBlockById(blockId);
    if (!block) throw new Error(`Unknown block: ${blockId}`);
    return blockToNode(block, `seed-${def.seedId}-${index}`);
  });

  const metadata: WorkflowMetadata = {
    seedId: def.seedId,
    sample: true,
    recipe: def.seedId.replace("sample-", ""),
  };

  return {
    name: def.name,
    description: def.description,
    nodes,
    metadata,
    status: "draft",
  };
}
