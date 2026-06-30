import { randomUUID } from "crypto";
import type {
  AutomationMetrics,
  AutomationRun,
  CreateWorkflowInput,
  ExecutionLog,
  TestRunResult,
  UpdateWorkflowInput,
  WorkflowRecord,
  WorkflowStatus,
  WorkflowVersion,
} from "./types";
import { syncWorkflowGraph } from "./connections";
import { executeWorkflowSimulation } from "./executor";

type MemoryState = {
  workflows: Map<string, WorkflowRecord>;
  versions: WorkflowVersion[];
  runs: AutomationRun[];
  logs: ExecutionLog[];
};

const globalStore = globalThis as typeof globalThis & {
  __actoraAutomationStore?: MemoryState;
};

function getStore(): MemoryState {
  if (!globalStore.__actoraAutomationStore) {
    globalStore.__actoraAutomationStore = {
      workflows: new Map(),
      versions: [],
      runs: [],
      logs: [],
    };
  }
  return globalStore.__actoraAutomationStore;
}

function now() {
  return new Date().toISOString();
}

function rowToWorkflow(row: WorkflowRecord): WorkflowRecord {
  return { ...row };
}

export class MemoryAutomationRepository {
  async listWorkflows(userId: string, status?: WorkflowStatus): Promise<WorkflowRecord[]> {
    const store = getStore();
    let items = [...store.workflows.values()].filter((w) => w.userId === userId);
    if (status) items = items.filter((w) => w.status === status);
    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getWorkflow(userId: string, id: string): Promise<WorkflowRecord | null> {
    const workflow = getStore().workflows.get(id);
    if (!workflow || workflow.userId !== userId) return null;
    return rowToWorkflow(workflow);
  }

  async createWorkflow(userId: string, input: CreateWorkflowInput, createdBy: string): Promise<WorkflowRecord> {
    const nodes = input.nodes ?? [];
    const graph = syncWorkflowGraph(nodes);
    const ts = now();
    const workflow: WorkflowRecord = {
      id: randomUUID(),
      userId,
      name: input.name ?? "Untitled Automation",
      description: input.description ?? "",
      status: input.status ?? "draft",
      nodes: graph.nodes,
      connections: input.connections ?? graph.connections,
      triggerBlockId: graph.triggerBlockId,
      metadata: input.metadata ?? {},
      version: 1,
      createdBy,
      createdAt: ts,
      updatedAt: ts,
      publishedAt: null,
    };
    getStore().workflows.set(workflow.id, workflow);
    await this.saveVersion(workflow, createdBy, "Initial version");
    return workflow;
  }

  async updateWorkflow(
    userId: string,
    id: string,
    input: UpdateWorkflowInput,
    updatedBy: string
  ): Promise<WorkflowRecord | null> {
    const existing = await this.getWorkflow(userId, id);
    if (!existing) return null;

    const nodes = input.nodes ?? existing.nodes;
    const graph = syncWorkflowGraph(nodes);

    const updated: WorkflowRecord = {
      ...existing,
      name: input.name ?? existing.name,
      description: input.description ?? existing.description,
      nodes: graph.nodes,
      connections: input.connections ?? graph.connections,
      triggerBlockId: graph.triggerBlockId,
      metadata: input.metadata ?? existing.metadata,
      updatedAt: now(),
    };

    getStore().workflows.set(id, updated);
    await this.saveVersion(updated, updatedBy, input.changeNote ?? "Draft saved");
    return updated;
  }

  async deleteWorkflow(userId: string, id: string): Promise<boolean> {
    const workflow = await this.getWorkflow(userId, id);
    if (!workflow) return false;
    const store = getStore();
    store.workflows.delete(id);
    store.versions = store.versions.filter((v) => v.workflowId !== id);
    store.runs = store.runs.filter((r) => r.workflowId !== id);
    return true;
  }

  async duplicateWorkflow(userId: string, id: string, createdBy: string): Promise<WorkflowRecord | null> {
    const source = await this.getWorkflow(userId, id);
    if (!source) return null;

    const nodes = source.nodes.map((n) => ({
      ...n,
      id: `${n.id}-copy-${randomUUID().slice(0, 8)}`,
    }));
    const graph = syncWorkflowGraph(nodes);

    return this.createWorkflow(
      userId,
      {
        name: `Copy of ${source.name}`,
        description: source.description,
        nodes: graph.nodes,
        connections: graph.connections,
        metadata: { ...source.metadata, duplicatedFrom: source.id },
        status: "draft",
      },
      createdBy
    );
  }

  async publishWorkflow(userId: string, id: string, publishedBy: string): Promise<WorkflowRecord | null> {
    const existing = await this.getWorkflow(userId, id);
    if (!existing) return null;
    if (existing.nodes.length === 0) {
      throw new Error("Cannot publish an empty workflow.");
    }
    if (!existing.nodes.some((n) => n.category === "trigger")) {
      throw new Error("Workflow must include a trigger block.");
    }

    const updated: WorkflowRecord = {
      ...existing,
      status: "active",
      version: existing.version + 1,
      publishedAt: now(),
      updatedAt: now(),
    };
    getStore().workflows.set(id, updated);
    await this.saveVersion(updated, publishedBy, "Published");
    return updated;
  }

  async pauseWorkflow(userId: string, id: string, updatedBy: string): Promise<WorkflowRecord | null> {
    const existing = await this.getWorkflow(userId, id);
    if (!existing) return null;
    const updated = { ...existing, status: "paused" as const, updatedAt: now() };
    getStore().workflows.set(id, updated);
    await this.saveVersion(updated, updatedBy, "Paused");
    return updated;
  }

  async saveVersion(workflow: WorkflowRecord, createdBy: string, changeNote?: string): Promise<WorkflowVersion> {
    const version: WorkflowVersion = {
      id: randomUUID(),
      workflowId: workflow.id,
      version: workflow.version,
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      nodes: workflow.nodes,
      connections: workflow.connections,
      triggerBlockId: workflow.triggerBlockId,
      metadata: workflow.metadata,
      createdBy,
      changeNote: changeNote ?? null,
      createdAt: now(),
    };
    getStore().versions.push(version);
    return version;
  }

  async listVersions(userId: string, workflowId: string): Promise<WorkflowVersion[]> {
    const workflow = await this.getWorkflow(userId, workflowId);
    if (!workflow) return [];
    return getStore()
      .versions.filter((v) => v.workflowId === workflowId)
      .sort((a, b) => b.version - a.version);
  }

  async restoreVersion(
    userId: string,
    workflowId: string,
    versionId: string,
    restoredBy: string
  ): Promise<WorkflowRecord | null> {
    const workflow = await this.getWorkflow(userId, workflowId);
    if (!workflow) return null;

    const snapshot = getStore().versions.find((v) => v.id === versionId && v.workflowId === workflowId);
    if (!snapshot) return null;

    return this.updateWorkflow(
      userId,
      workflowId,
      {
        name: snapshot.name,
        description: snapshot.description,
        nodes: snapshot.nodes.map((n) => ({ ...n })),
        connections: snapshot.connections.map((c) => ({ ...c })),
        changeNote: `Restored from v${snapshot.version}`,
      },
      restoredBy
    );
  }

  async recordRun(userId: string, result: TestRunResult): Promise<AutomationRun> {
    const store = getStore();
    store.runs.unshift(result.run);
    store.logs.push(...result.logs);
    return result.run;
  }

  async listRuns(userId: string, workflowId?: string): Promise<AutomationRun[]> {
    let runs = getStore().runs.filter((r) => {
      const workflow = getStore().workflows.get(r.workflowId);
      return workflow?.userId === userId;
    });
    if (workflowId) runs = runs.filter((r) => r.workflowId === workflowId);
    return runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  async getRunLogs(userId: string, runId: string): Promise<ExecutionLog[]> {
    const run = getStore().runs.find((r) => r.id === runId);
    if (!run) return [];
    const workflow = getStore().workflows.get(run.workflowId);
    if (!workflow || workflow.userId !== userId) return [];
    return getStore().logs.filter((l) => l.runId === runId).sort((a, b) => a.stepIndex - b.stepIndex);
  }

  async runTest(userId: string, workflowId: string, payload?: Record<string, unknown>): Promise<TestRunResult | null> {
    const workflow = await this.getWorkflow(userId, workflowId);
    if (!workflow) return null;
    const result = await executeWorkflowSimulation(workflow, { isTest: true, payload });
    await this.recordRun(userId, result);
    return result;
  }

  async getMetrics(userId: string): Promise<AutomationMetrics> {
    const workflows = await this.listWorkflows(userId);
    const runs = await this.listRuns(userId);
    const today = new Date().toISOString().slice(0, 10);
    const todayRuns = runs.filter((r) => r.startedAt.startsWith(today));
    const successes = runs.filter((r) => r.status === "success").length;
    const successRate = runs.length ? Math.round((successes / runs.length) * 1000) / 10 : 100;
    const timeSavedHours = Math.round((todayRuns.length * 6) / 10) / 10;

    return {
      activeAutomations: workflows.filter((w) => w.status === "active").length,
      todayRuns: todayRuns.length,
      successRate,
      timeSavedHours,
    };
  }
}

export const memoryAutomationRepository = new MemoryAutomationRepository();
