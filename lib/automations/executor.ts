import { randomUUID } from "crypto";
import type {
  AutomationRun,
  ExecutionLog,
  TestRunResult,
  WorkflowNode,
  WorkflowRecord,
} from "./types";
import { getMockPayloadForTrigger, simulateStepOutput } from "./mock-payloads";

const STEP_DELAY_MS = 35;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeWorkflowSimulation(
  workflow: WorkflowRecord,
  options: { isTest?: boolean; payload?: Record<string, unknown> } = {}
): Promise<TestRunResult> {
  const isTest = options.isTest ?? true;
  const runId = randomUUID();
  const startedAt = new Date();
  const payload =
    options.payload ?? getMockPayloadForTrigger(workflow.triggerBlockId);
  const logs: ExecutionLog[] = [];
  let context: Record<string, unknown> = { ...payload };
  let failed = false;
  let errorMessage: string | null = null;

  const triggerNode = workflow.nodes.find((n) => n.category === "trigger");
  const triggerLabel = triggerNode?.label ?? "Manual Trigger";

  for (let i = 0; i < workflow.nodes.length; i++) {
    const node = workflow.nodes[i];
    const stepStart = Date.now();

    if (failed && node.category !== "output") {
      logs.push(buildLog(runId, i, node, "skipped", "Skipped due to prior failure", {}, 0));
      continue;
    }

    await sleep(STEP_DELAY_MS);

    try {
      const output = simulateStepOutput(node, context);
      context = { ...context, ...output };

      if (node.blockId === "condition" && output.matched === false) {
        logs.push(
          buildLog(runId, i, node, "skipped", "Condition not met — branch skipped", output, Date.now() - stepStart)
        );
        continue;
      }

      logs.push(
        buildLog(
          runId,
          i,
          node,
          "success",
          `${node.label} completed successfully`,
          output,
          Date.now() - stepStart
        )
      );
    } catch (err) {
      failed = true;
      errorMessage = err instanceof Error ? err.message : "Step execution failed";
      logs.push(
        buildLog(runId, i, node, "failed", errorMessage, {}, Date.now() - stepStart)
      );
    }
  }

  const completedAt = new Date();
  const durationMs = completedAt.getTime() - startedAt.getTime();
  const hasFailure = logs.some((l) => l.status === "failed");
  const allSkipped = logs.length > 0 && logs.every((l) => l.status === "skipped");

  const status: AutomationRun["status"] = hasFailure
    ? "failed"
    : allSkipped
      ? "skipped"
      : "success";

  const run: AutomationRun = {
    id: runId,
    workflowId: workflow.id,
    automationId: workflow.id,
    automationName: workflow.name,
    status,
    trigger: triggerLabel,
    isTest,
    durationMs,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    payload,
    errorMessage,
    logs,
  };

  return { run, logs };
}

function buildLog(
  runId: string,
  stepIndex: number,
  node: WorkflowNode,
  status: ExecutionLog["status"],
  message: string,
  output: Record<string, unknown>,
  durationMs: number
): ExecutionLog {
  return {
    id: randomUUID(),
    runId,
    stepIndex,
    nodeId: node.id,
    blockId: node.blockId,
    label: node.label,
    status,
    message,
    output,
    durationMs,
    loggedAt: new Date().toISOString(),
  };
}
