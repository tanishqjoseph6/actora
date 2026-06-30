import { NextRequest } from "next/server";
import { getAutomationUserId } from "@/lib/automations/auth";
import { automationRepository } from "@/lib/automations/repository";
import { apiError, apiOk } from "@/lib/automations/api-utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const userId = await getAutomationUserId();
  if (!userId) return apiError("Not authenticated.", 401);

  const { id } = await context.params;

  try {
    const versions = await automationRepository.listVersions(userId, id);
    return apiOk({ versions });
  } catch (error) {
    console.error("[automations/versions] failed:", error);
    return apiError(error instanceof Error ? error.message : "Failed to list versions.");
  }
}
