export type AutomationStatus = "active" | "paused" | "draft" | "error";

export type AutomationView =
  | "templates"
  | "my-automations"
  | "drafts"
  | "history"
  | "marketplace";

export type NodeCategory = "trigger" | "condition" | "ai" | "output";

export type BlockDefinition = {
  id: string;
  category: NodeCategory;
  label: string;
  description: string;
  icon: string;
};

export type WorkflowNode = {
  id: string;
  blockId: string;
  category: NodeCategory;
  label: string;
  icon: string;
};

export type Automation = {
  id: string;
  name: string;
  description: string;
  status: AutomationStatus;
  lastRun: string;
  runsToday: number;
  successRate: number;
  createdBy: string;
  executionTimeMs: number;
  nodes: WorkflowNode[];
  templateId?: string;
  updatedAt: string;
};

export type AutomationTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  nodes: WorkflowNode[];
  popularity: number;
};

export type AutomationRun = {
  id: string;
  automationId: string;
  automationName: string;
  status: "success" | "failed" | "skipped";
  startedAt: string;
  durationMs: number;
  trigger: string;
};

export type AutomationMetrics = {
  activeAutomations: number;
  todayRuns: number;
  successRate: number;
  timeSavedHours: number;
};
