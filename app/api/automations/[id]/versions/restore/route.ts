import { NextRequest } from "next/server";
import { getAutomationUserId } from "@/lib/automations/auth";
import { automationRepository } from "@/lib/automations/repository";
import { toAutomationCard } from "@/lib/automations/mappers";
import { apiError, apiOk } from "@/lib/automations/api-utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const userId = await getAutomationUserId();
  if (!userId) return apiError("Not authenticated.", 401);

  const { id } = await context.params;

  try {
    const body = (await request.json()) as { versionId?: string };
    if (!body.versionId) return apiError("versionId is required.", 400);

    const workflow = await automationRepository.restoreVersion(userId, id, body.versionId, userId);
    if (!workflow) return apiError("Workflow or version not found.", 404);

    const runs = await automationRepository.listRuns(userId);
    return apiOk({ workflow: toAutomationCard(workflow, runs) });
  } catch (error) {
    console.error("[automations/versions/restore] failed:", error);
    return apiError(error instanceof Error ? error.message : "Failed to restore version.");
  }
}
