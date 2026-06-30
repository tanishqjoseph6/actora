import { NextRequest } from "next/server";
import { getAutomationUserId } from "@/lib/automations/auth";
import { automationRepository } from "@/lib/automations/repository";
import { toAutomationCard } from "@/lib/automations/mappers";
import { apiError, apiOk } from "@/lib/automations/api-utils";
import { isSupabaseConfigured } from "@/lib/supabase-admin";
import type { CreateWorkflowInput, WorkflowStatus } from "@/lib/automations/types";

export async function GET(request: NextRequest) {
  const userId = await getAutomationUserId();
  if (!userId) return apiError("Not authenticated.", 401);

  try {
    const status = request.nextUrl.searchParams.get("status") as WorkflowStatus | null;
    const [workflows, runs, metrics] = await Promise.all([
      automationRepository.listWorkflows(userId, status ?? undefined),
      automationRepository.listRuns(userId),
      automationRepository.getMetrics(userId),
    ]);

    const automations = workflows.map((w) => toAutomationCard(w, runs));

    return apiOk({
      automations,
      metrics,
      store: isSupabaseConfigured() ? "supabase" : "memory",
    });
  } catch (error) {
    console.error("[automations] GET failed:", error);
    return apiError(error instanceof Error ? error.message : "Failed to list automations.");
  }
}

export async function POST(request: NextRequest) {
  const userId = await getAutomationUserId();
  if (!userId) return apiError("Not authenticated.", 401);

  try {
    const body = (await request.json()) as CreateWorkflowInput;
    const workflow = await automationRepository.createWorkflow(userId, body, userId);
    const runs = await automationRepository.listRuns(userId);
    return apiOk({ workflow: toAutomationCard(workflow, runs) }, 201);
  } catch (error) {
    console.error("[automations] POST failed:", error);
    return apiError(error instanceof Error ? error.message : "Failed to create automation.");
  }
}
