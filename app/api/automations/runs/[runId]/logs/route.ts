import { NextRequest } from "next/server";
import { getAutomationUserId } from "@/lib/automations/auth";
import { automationRepository } from "@/lib/automations/repository";
import { apiError, apiOk } from "@/lib/automations/api-utils";

type RouteContext = { params: Promise<{ runId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const userId = await getAutomationUserId();
  if (!userId) return apiError("Not authenticated.", 401);

  const { runId } = await context.params;

  try {
    const logs = await automationRepository.getRunLogs(userId, runId);
    return apiOk({ logs });
  } catch (error) {
    console.error("[automations/runs/logs] failed:", error);
    return apiError(error instanceof Error ? error.message : "Failed to fetch run logs.");
  }
}
