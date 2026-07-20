import { automationRepository } from "@/lib/automations/repository";
import { executeWorkflow } from "@/lib/automations/executor";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { TestRunResult } from "@/lib/automations/types";

export type AutomationTriggerId =
  | "new-email"
  | "new-lead"
  | "meeting-created"
  | "task-due"
  | "invoice-paid"
  | "manual-trigger";

async function alreadyDispatched(
  userId: string,
  dedupeKey: string
): Promise<boolean> {
  const db = getSupabaseAdmin();
  if (!db) return false;
  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const { data } = await db
    .from("workflow_runs")
    .select("id, payload")
    .eq("user_id", userId)
    .gte("started_at", since)
    .limit(40);

  if (!data?.length) return false;
  return data.some((row) => {
    const payload = row.payload as Record<string, unknown> | null;
    return payload?.dedupeKey === dedupeKey;
  });
}

/**
 * Dispatch a trigger event to all active workflows for this user
 * whose trigger block matches. Runs sequentially; failures are isolated.
 */
export async function dispatchAutomationTrigger(
  userId: string,
  triggerBlockId: AutomationTriggerId,
  payload: Record<string, unknown>
): Promise<{ ran: number; results: TestRunResult[] }> {
  try {
    const dedupeKey = strDedupe(triggerBlockId, payload);
    if (dedupeKey && (await alreadyDispatched(userId, dedupeKey))) {
      return { ran: 0, results: [] };
    }

    const workflows = await automationRepository.listWorkflows(userId);
    const active = workflows.filter(
      (w) =>
        w.status === "active" &&
        (w.triggerBlockId === triggerBlockId ||
          w.nodes.some(
            (n) => n.category === "trigger" && n.blockId === triggerBlockId
          ))
    );

    if (!active.length) return { ran: 0, results: [] };

    const results: TestRunResult[] = [];
    for (const workflow of active) {
      try {
        const result = await executeWorkflow(workflow, {
          isTest: false,
          live: true,
          userId,
          payload: {
            ...payload,
            dedupeKey,
            triggeredAt: new Date().toISOString(),
            triggerBlockId,
          },
        });
        await automationRepository.recordRun(userId, result);
        results.push(result);
      } catch (error) {
        console.error(
          `[automations/dispatch] workflow ${workflow.id} failed`,
          error
        );
      }
    }

    return { ran: results.length, results };
  } catch (error) {
    console.error("[automations/dispatch] failed", error);
    return { ran: 0, results: [] };
  }
}

function strDedupe(
  trigger: string,
  payload: Record<string, unknown>
): string | null {
  const id =
    (typeof payload.gmailMessageId === "string" && payload.gmailMessageId) ||
    (typeof payload.messageId === "string" && payload.messageId) ||
    (typeof payload.contactId === "string" && payload.contactId) ||
    (typeof payload.eventId === "string" && payload.eventId) ||
    null;
  return id ? `${trigger}:${id}` : null;
}
