import { NextRequest } from "next/server";
import { getAutomationUserId } from "@/lib/automations/auth";
import { automationRepository } from "@/lib/automations/repository";
import { formatRunTime } from "@/lib/automations/mappers";
import { apiError, apiOk } from "@/lib/automations/api-utils";

export async function GET(request: NextRequest) {
  const userId = await getAutomationUserId();
  if (!userId) return apiError("Not authenticated.", 401);

  try {
    const workflowId = request.nextUrl.searchParams.get("workflowId") ?? undefined;
    const runs = await automationRepository.listRuns(userId, workflowId ?? undefined);

    const formatted = runs.map((run) => ({
      ...run,
      automationId: run.workflowId,
      startedAtDisplay: formatRunTime(run.startedAt),
    }));

    return apiOk({ runs: formatted });
  } catch (error) {
    console.error("[automations/runs] failed:", error);
    return apiError(error instanceof Error ? error.message : "Failed to list runs.");
  }
}
