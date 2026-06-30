import { randomUUID } from "crypto";
import { getSupabaseAdmin, isMissingAutomationSchemaError } from "@/lib/supabase-admin";
import type {
  AutomationMetrics,
  AutomationRun,
  CreateWorkflowInput,
  ExecutionLog,
  TestRunResult,
  UpdateWorkflowInput,
  WorkflowMetadata,
  WorkflowRecord,
  WorkflowStatus,
  WorkflowVersion,
} from "./types";
import { syncWorkflowGraph } from "./connections";
import { executeWorkflowSimulation } from "./executor";
import { memoryAutomationRepository } from "./memory-store";

type WorkflowRow = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  nodes: unknown;
  connections: unknown;
  trigger_block_id: string | null;
  metadata: unknown;
  version: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

type VersionRow = {
  id: string;
  workflow_id: string;
  version: number;
  name: string;
  description: string;
  status: WorkflowStatus;
  nodes: unknown;
  connections: unknown;
  trigger_block_id: string | null;
  metadata: unknown;
  created_by: string;
  change_note: string | null;
  created_at: string;
};

type RunRow = {
  id: string;
  workflow_id: string;
  user_id: string;
  workflow_name: string;
  status: AutomationRun["status"];
  trigger_label: string;
  is_test: boolean;
  duration_ms: number;
  payload: unknown;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
};

type LogRow = {
  id: string;
  run_id: string;
  step_index: number;
  node_id: string;
  block_id: string;
  label: string;
  status: ExecutionLog["status"];
  message: string;
  output: unknown;
  duration_ms: number;
  logged_at: string;
};

function mapWorkflow(row: WorkflowRow): WorkflowRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    status: row.status,
    nodes: (row.nodes as WorkflowRecord["nodes"]) ?? [],
    connections: (row.connections as WorkflowRecord["connections"]) ?? [],
    triggerBlockId: row.trigger_block_id,
    metadata: (row.metadata as WorkflowMetadata) ?? {},
    version: row.version,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  };
}

function mapVersion(row: VersionRow): WorkflowVersion {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    version: row.version,
    name: row.name,
    description: row.description,
    status: row.status,
    nodes: (row.nodes as WorkflowVersion["nodes"]) ?? [],
    connections: (row.connections as WorkflowVersion["connections"]) ?? [],
    triggerBlockId: row.trigger_block_id,
    metadata: (row.metadata as WorkflowMetadata) ?? {},
    createdBy: row.created_by,
    changeNote: row.change_note,
    createdAt: row.created_at,
  };
}

function mapRun(row: RunRow): AutomationRun {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    automationId: row.workflow_id,
    automationName: row.workflow_name,
    status: row.status,
    trigger: row.trigger_label,
    isTest: row.is_test,
    durationMs: row.duration_ms,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    payload: (row.payload as Record<string, unknown>) ?? {},
    errorMessage: row.error_message,
  };
}

function mapLog(row: LogRow): ExecutionLog {
  return {
    id: row.id,
    runId: row.run_id,
    stepIndex: row.step_index,
    nodeId: row.node_id,
    blockId: row.block_id,
    label: row.label,
    status: row.status,
    message: row.message,
    output: (row.output as Record<string, unknown>) ?? {},
    durationMs: row.duration_ms,
    loggedAt: row.logged_at,
  };
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export class SupabaseAutomationRepository {
  private useMemoryFallback() {
    return memoryAutomationRepository;
  }

  private client() {
    return getSupabaseAdmin();
  }

  private handleDbError(error: { message: string }): never {
    if (isMissingAutomationSchemaError(error.message)) {
      throw new Error(
        "Automation tables not found. Run supabase/migrations/001_automations.sql in the Supabase SQL Editor."
      );
    }
    throw new Error(error.message);
  }

  async listWorkflows(userId: string, status?: WorkflowStatus): Promise<WorkflowRecord[]> {
    const db = this.client();
    if (!db) return this.useMemoryFallback().listWorkflows(userId, status);

    let query = db.from("workflows").select("*").eq("user_id", userId).order("updated_at", { ascending: false });
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) this.handleDbError(error);
    return (data as WorkflowRow[]).map(mapWorkflow);
  }

  async getWorkflow(userId: string, id: string): Promise<WorkflowRecord | null> {
    const db = this.client();
    if (!db) return this.useMemoryFallback().getWorkflow(userId, id);

    const { data, error } = await db.from("workflows").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
    if (error) this.handleDbError(error);
    return data ? mapWorkflow(data as WorkflowRow) : null;
  }

  async createWorkflow(userId: string, input: CreateWorkflowInput, createdBy: string): Promise<WorkflowRecord> {
    const db = this.client();
    if (!db) return this.useMemoryFallback().createWorkflow(userId, input, createdBy);

    const nodes = input.nodes ?? [];
    const graph = syncWorkflowGraph(nodes);
    const { data, error } = await db
      .from("workflows")
      .insert({
        user_id: userId,
        name: input.name ?? "Untitled Automation",
        description: input.description ?? "",
        status: input.status ?? "draft",
        nodes: graph.nodes,
        connections: input.connections ?? graph.connections,
        trigger_block_id: graph.triggerBlockId,
        metadata: input.metadata ?? {},
        created_by: createdBy,
      })
      .select("*")
      .single();

    if (error) this.handleDbError(error);
    const workflow = mapWorkflow(data as WorkflowRow);
    await this.saveVersion(workflow, createdBy, "Initial version");
    return workflow;
  }

  async updateWorkflow(
    userId: string,
    id: string,
    input: UpdateWorkflowInput,
    updatedBy: string
  ): Promise<WorkflowRecord | null> {
    const db = this.client();
    if (!db) return this.useMemoryFallback().updateWorkflow(userId, id, input, updatedBy);

    const existing = await this.getWorkflow(userId, id);
    if (!existing) return null;

    const nodes = input.nodes ?? existing.nodes;
    const graph = syncWorkflowGraph(nodes);

    const { data, error } = await db
      .from("workflows")
      .update({
        name: input.name ?? existing.name,
        description: input.description ?? existing.description,
        nodes: graph.nodes,
        connections: input.connections ?? graph.connections,
        trigger_block_id: graph.triggerBlockId,
        metadata: input.metadata ?? existing.metadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) this.handleDbError(error);
    const workflow = mapWorkflow(data as WorkflowRow);
    await this.saveVersion(workflow, updatedBy, input.changeNote ?? "Draft saved");
    return workflow;
  }

  async deleteWorkflow(userId: string, id: string): Promise<boolean> {
    const db = this.client();
    if (!db) return this.useMemoryFallback().deleteWorkflow(userId, id);

    const { error, count } = await db.from("workflows").delete({ count: "exact" }).eq("id", id).eq("user_id", userId);
    if (error) this.handleDbError(error);
    return (count ?? 0) > 0;
  }

  async duplicateWorkflow(userId: string, id: string, createdBy: string): Promise<WorkflowRecord | null> {
    const source = await this.getWorkflow(userId, id);
    if (!source) return null;

    const nodes = source.nodes.map((n) => ({
      ...n,
      id: `${n.blockId}-${randomUUID().slice(0, 8)}`,
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
    const db = this.client();
    if (!db) return this.useMemoryFallback().publishWorkflow(userId, id, publishedBy);

    const existing = await this.getWorkflow(userId, id);
    if (!existing) return null;
    if (existing.nodes.length === 0) throw new Error("Cannot publish an empty workflow.");
    if (!existing.nodes.some((n) => n.category === "trigger")) {
      throw new Error("Workflow must include a trigger block.");
    }

    const nextVersion = existing.version + 1;
    const publishedAt = new Date().toISOString();

    const { data, error } = await db
      .from("workflows")
      .update({
        status: "active",
        version: nextVersion,
        published_at: publishedAt,
        updated_at: publishedAt,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) this.handleDbError(error);
    const workflow = mapWorkflow(data as WorkflowRow);
    await this.saveVersion(workflow, publishedBy, "Published");
    return workflow;
  }

  async pauseWorkflow(userId: string, id: string, updatedBy: string): Promise<WorkflowRecord | null> {
    const db = this.client();
    if (!db) return this.useMemoryFallback().pauseWorkflow(userId, id, updatedBy);

    const { data, error } = await db
      .from("workflows")
      .update({ status: "paused", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) this.handleDbError(error);
    const workflow = mapWorkflow(data as WorkflowRow);
    await this.saveVersion(workflow, updatedBy, "Paused");
    return workflow;
  }

  async saveVersion(workflow: WorkflowRecord, createdBy: string, changeNote?: string): Promise<WorkflowVersion> {
    const db = this.client();
    if (!db) return this.useMemoryFallback().saveVersion(workflow, createdBy, changeNote);

    const { data, error } = await db
      .from("workflow_versions")
      .upsert(
        {
          workflow_id: workflow.id,
          version: workflow.version,
          name: workflow.name,
          description: workflow.description,
          status: workflow.status,
          nodes: workflow.nodes,
          connections: workflow.connections,
          trigger_block_id: workflow.triggerBlockId,
          metadata: workflow.metadata,
          created_by: createdBy,
          change_note: changeNote ?? null,
        },
        { onConflict: "workflow_id,version" }
      )
      .select("*")
      .single();

    if (error) this.handleDbError(error);
    return mapVersion(data as VersionRow);
  }

  async listVersions(userId: string, workflowId: string): Promise<WorkflowVersion[]> {
    const db = this.client();
    if (!db) return this.useMemoryFallback().listVersions(userId, workflowId);

    const workflow = await this.getWorkflow(userId, workflowId);
    if (!workflow) return [];

    const { data, error } = await db
      .from("workflow_versions")
      .select("*")
      .eq("workflow_id", workflowId)
      .order("version", { ascending: false });

    if (error) this.handleDbError(error);
    return (data as VersionRow[]).map(mapVersion);
  }

  async restoreVersion(
    userId: string,
    workflowId: string,
    versionId: string,
    restoredBy: string
  ): Promise<WorkflowRecord | null> {
    const db = this.client();
    if (!db) return this.useMemoryFallback().restoreVersion(userId, workflowId, versionId, restoredBy);

    const workflow = await this.getWorkflow(userId, workflowId);
    if (!workflow) return null;

    const { data: versionRow, error: versionError } = await db
      .from("workflow_versions")
      .select("*")
      .eq("id", versionId)
      .eq("workflow_id", workflowId)
      .maybeSingle();

    if (versionError) this.handleDbError(versionError);
    if (!versionRow) return null;

    const snapshot = mapVersion(versionRow as VersionRow);
    return this.updateWorkflow(
      userId,
      workflowId,
      {
        name: snapshot.name,
        description: snapshot.description,
        nodes: snapshot.nodes,
        connections: snapshot.connections,
        changeNote: `Restored from v${snapshot.version}`,
      },
      restoredBy
    );
  }

  async recordRun(userId: string, result: TestRunResult): Promise<AutomationRun> {
    const db = this.client();
    if (!db) return this.useMemoryFallback().recordRun(userId, result);

    const { run, logs } = result;
    const { error: runError } = await db.from("workflow_runs").insert({
      id: run.id,
      workflow_id: run.workflowId,
      user_id: userId,
      workflow_name: run.automationName,
      status: run.status,
      trigger_label: run.trigger,
      is_test: run.isTest,
      duration_ms: run.durationMs,
      payload: run.payload,
      error_message: run.errorMessage,
      started_at: run.startedAt,
      completed_at: run.completedAt,
    });

    if (runError) this.handleDbError(runError);

    if (logs.length > 0) {
      const { error: logError } = await db.from("workflow_run_logs").insert(
        logs.map((log) => ({
          id: log.id,
          run_id: log.runId,
          step_index: log.stepIndex,
          node_id: log.nodeId,
          block_id: log.blockId,
          label: log.label,
          status: log.status,
          message: log.message,
          output: log.output,
          duration_ms: log.durationMs,
          logged_at: log.loggedAt,
        }))
      );
      if (logError) this.handleDbError(logError);
    }

    return run;
  }

  async listRuns(userId: string, workflowId?: string): Promise<AutomationRun[]> {
    const db = this.client();
    if (!db) return this.useMemoryFallback().listRuns(userId, workflowId);

    let query = db.from("workflow_runs").select("*").eq("user_id", userId).order("started_at", { ascending: false });
    if (workflowId) query = query.eq("workflow_id", workflowId);

    const { data, error } = await query.limit(100);
    if (error) this.handleDbError(error);
    return (data as RunRow[]).map(mapRun);
  }

  async getRunLogs(userId: string, runId: string): Promise<ExecutionLog[]> {
    const db = this.client();
    if (!db) return this.useMemoryFallback().getRunLogs(userId, runId);

    const { data: runData, error: runError } = await db
      .from("workflow_runs")
      .select("workflow_id")
      .eq("id", runId)
      .eq("user_id", userId)
      .maybeSingle();

    if (runError) this.handleDbError(runError);
    if (!runData) return [];

    const { data, error } = await db
      .from("workflow_run_logs")
      .select("*")
      .eq("run_id", runId)
      .order("step_index", { ascending: true });

    if (error) this.handleDbError(error);
    return (data as LogRow[]).map(mapLog);
  }

  async runTest(userId: string, workflowId: string, payload?: Record<string, unknown>): Promise<TestRunResult | null> {
    const workflow = await this.getWorkflow(userId, workflowId);
    if (!workflow) return null;
    const result = await executeWorkflowSimulation(workflow, { isTest: true, payload });
    await this.recordRun(userId, result);
    return result;
  }

  async getMetrics(userId: string): Promise<AutomationMetrics> {
    const db = this.client();
    if (!db) return this.useMemoryFallback().getMetrics(userId);

    const workflows = await this.listWorkflows(userId);
    const runs = await this.listRuns(userId);
    const today = new Date().toISOString().slice(0, 10);
    const todayRuns = runs.filter((r) => r.startedAt.startsWith(today));
    const successes = runs.filter((r) => r.status === "success").length;
    const successRate = runs.length ? Math.round((successes / runs.length) * 1000) / 10 : 100;

    return {
      activeAutomations: workflows.filter((w) => w.status === "active").length,
      todayRuns: todayRuns.length,
      successRate,
      timeSavedHours: Math.round((todayRuns.length * 6) / 10) / 10,
    };
  }

  async enrichAutomation(workflow: WorkflowRecord, runs: AutomationRun[]) {
    const workflowRuns = runs.filter((r) => r.workflowId === workflow.id);
    const latest = workflowRuns[0];
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = workflowRuns.filter((r) => r.startedAt.startsWith(today)).length;
    const successes = workflowRuns.filter((r) => r.status === "success").length;
    const successRate = workflowRuns.length
      ? Math.round((successes / workflowRuns.length) * 1000) / 10
      : 0;

    return {
      ...workflow,
      lastRun: latest ? formatRelativeTime(latest.startedAt) : "Never",
      runsToday: todayCount,
      successRate,
      executionTimeMs: latest?.durationMs ?? 0,
      templateId: workflow.metadata.templateId as string | undefined,
      updatedAt: workflow.updatedAt,
    };
  }
}

export const automationRepository = new SupabaseAutomationRepository();
