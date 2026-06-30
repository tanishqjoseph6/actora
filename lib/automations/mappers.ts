import { getBlockById } from "./constants";
import type { Automation, WorkflowRecord } from "./types";
import type { AutomationRun } from "./types";

export function toAutomationCard(
  workflow: WorkflowRecord,
  runs: AutomationRun[]
): Automation {
  const workflowRuns = runs.filter((r) => r.workflowId === workflow.id);
  const latest = workflowRuns[0];
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = workflowRuns.filter((r) => isToday(r.startedAt, today)).length;
  const successes = workflowRuns.filter((r) => r.status === "success").length;
  const successRate = workflowRuns.length
    ? Math.round((successes / workflowRuns.length) * 1000) / 10
    : 0;

  const triggerNode = workflow.nodes.find((n) => n.category === "trigger");
  const triggerBlock = workflow.triggerBlockId
    ? getBlockById(workflow.triggerBlockId)
    : triggerNode
      ? getBlockById(triggerNode.blockId)
      : undefined;

  return {
    ...workflow,
    lastRun: latest ? formatRelativeTime(latest.startedAt) : "Never",
    lastRunAt: latest?.startedAt ?? null,
    runsToday: todayCount,
    totalExecutions: workflowRuns.length,
    successRate,
    executionTimeMs: latest?.durationMs ?? 0,
    triggerLabel: triggerBlock?.label ?? triggerNode?.label ?? "No trigger",
    templateId: workflow.metadata.templateId as string | undefined,
  };
}

function isToday(startedAt: string, today: string): boolean {
  if (startedAt.includes("ago") || startedAt === "Just now" || startedAt === "Never") {
    return false;
  }
  return startedAt.startsWith(today);
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

export function formatRunTime(iso: string): string {
  return formatRelativeTime(iso);
}
