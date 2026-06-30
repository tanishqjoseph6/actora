import { NextRequest } from "next/server";
import { getAutomationUserId } from "@/lib/automations/auth";
import { automationRepository } from "@/lib/automations/repository";
import { toAutomationCard } from "@/lib/automations/mappers";
import { apiError, apiOk } from "@/lib/automations/api-utils";
import type { UpdateWorkflowInput } from "@/lib/automations/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const userId = await getAutomationUserId();
  if (!userId) return apiError("Not authenticated.", 401);

  const { id } = await context.params;

  try {
    const workflow = await automationRepository.getWorkflow(userId, id);
    if (!workflow) return apiError("Workflow not found.", 404);

    const [runs, versions] = await Promise.all([
      automationRepository.listRuns(userId, id),
      automationRepository.listVersions(userId, id),
    ]);

    return apiOk({
      workflow: toAutomationCard(workflow, runs),
      versions,
      runs,
    });
  } catch (error) {
    console.error("[automations/id] GET failed:", error);
    return apiError(error instanceof Error ? error.message : "Failed to fetch workflow.");
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await getAutomationUserId();
  if (!userId) return apiError("Not authenticated.", 401);

  const { id } = await context.params;

  try {
    const body = (await request.json()) as UpdateWorkflowInput;
    const workflow = await automationRepository.updateWorkflow(userId, id, body, userId);
    if (!workflow) return apiError("Workflow not found.", 404);

    const runs = await automationRepository.listRuns(userId);
    return apiOk({ workflow: toAutomationCard(workflow, runs) });
  } catch (error) {
    console.error("[automations/id] PATCH failed:", error);
    return apiError(error instanceof Error ? error.message : "Failed to update workflow.");
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const userId = await getAutomationUserId();
  if (!userId) return apiError("Not authenticated.", 401);

  const { id } = await context.params;

  try {
    const deleted = await automationRepository.deleteWorkflow(userId, id);
    if (!deleted) return apiError("Workflow not found.", 404);
    return apiOk({ success: true });
  } catch (error) {
    console.error("[automations/id] DELETE failed:", error);
    return apiError(error instanceof Error ? error.message : "Failed to delete workflow.");
  }
}
