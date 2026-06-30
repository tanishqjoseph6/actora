export type WorkflowStatus = "draft" | "active" | "paused";

export type AutomationStatus = WorkflowStatus | "error";

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

export type WorkflowConnection = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
};

export type WorkflowMetadata = {
  templateId?: string;
  tags?: string[];
  [key: string]: unknown;
};

export type WorkflowRecord = {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  triggerBlockId: string | null;
  metadata: WorkflowMetadata;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type WorkflowVersion = {
  id: string;
  workflowId: string;
  version: number;
  name: string;
  description: string;
  status: WorkflowStatus;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  triggerBlockId: string | null;
  metadata: WorkflowMetadata;
  createdBy: string;
  changeNote: string | null;
  createdAt: string;
};

export type Automation = WorkflowRecord & {
  lastRun: string;
  lastRunAt: string | null;
  runsToday: number;
  totalExecutions: number;
  successRate: number;
  executionTimeMs: number;
  triggerLabel: string;
  templateId?: string;
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

export type RunStatus = "running" | "success" | "failed" | "skipped";

export type ExecutionLog = {
  id: string;
  runId: string;
  stepIndex: number;
  nodeId: string;
  blockId: string;
  label: string;
  status: "success" | "failed" | "skipped";
  message: string;
  output: Record<string, unknown>;
  durationMs: number;
  loggedAt: string;
};

export type AutomationRun = {
  id: string;
  workflowId: string;
  automationId: string;
  automationName: string;
  status: RunStatus;
  trigger: string;
  isTest: boolean;
  durationMs: number;
  startedAt: string;
  startedAtDisplay?: string;
  completedAt: string | null;
  payload: Record<string, unknown>;
  errorMessage: string | null;
  logs?: ExecutionLog[];
};

export type AutomationMetrics = {
  activeAutomations: number;
  todayRuns: number;
  successRate: number;
  timeSavedHours: number;
};

export type CreateWorkflowInput = {
  name?: string;
  description?: string;
  nodes?: WorkflowNode[];
  connections?: WorkflowConnection[];
  metadata?: WorkflowMetadata;
  status?: WorkflowStatus;
};

export type UpdateWorkflowInput = {
  name?: string;
  description?: string;
  nodes?: WorkflowNode[];
  connections?: WorkflowConnection[];
  metadata?: WorkflowMetadata;
  changeNote?: string;
};

export type TestRunResult = {
  run: AutomationRun;
  logs: ExecutionLog[];
};
