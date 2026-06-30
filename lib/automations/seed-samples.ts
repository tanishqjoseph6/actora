import { blockToNode, getBlockById } from "./constants";
import type { CreateWorkflowInput, WorkflowMetadata } from "./types";

export type SampleWorkflowDef = {
  seedId: string;
  name: string;
  description: string;
  blockIds: string[];
  publish: boolean;
};

export const SAMPLE_WORKFLOW_DEFS: SampleWorkflowDef[] = [
  {
    seedId: "sample-gmail-ai-reply",
    name: "Gmail → AI Reply",
    description: "When a new email arrives, generate an AI reply and send it automatically.",
    blockIds: ["new-email", "generate-reply", "send-email"],
    publish: true,
  },
  {
    seedId: "sample-new-lead-crm",
    name: "New Lead → CRM Contact",
    description: "Extract contact details from a new lead and create a CRM record.",
    blockIds: ["new-lead", "extract-contact", "create-crm-lead", "update-crm"],
    publish: true,
  },
  {
    seedId: "sample-email-slack",
    name: "Email → Slack Notification",
    description: "Classify incoming email and send a Slack notification (mock).",
    blockIds: ["new-email", "classify-email", "slack-whatsapp"],
    publish: false,
  },
];

export function buildSampleWorkflowInput(def: SampleWorkflowDef): CreateWorkflowInput {
  const nodes = def.blockIds.map((blockId, index) => {
    const block = getBlockById(blockId);
    if (!block) throw new Error(`Unknown block: ${blockId}`);
    return blockToNode(block, `seed-${def.seedId}-${index}`);
  });

  const metadata: WorkflowMetadata = {
    seedId: def.seedId,
    sample: true,
  };

  return {
    name: def.name,
    description: def.description,
    nodes,
    metadata,
    status: "draft",
  };
}
