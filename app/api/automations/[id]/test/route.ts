import { NextRequest } from "next/server";
import { getAutomationUserId } from "@/lib/automations/auth";
import { automationRepository } from "@/lib/automations/repository";
import { apiError, apiOk } from "@/lib/automations/api-utils";

import type { WorkflowNode } from "@/lib/automations/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const userId = await getAutomationUserId();
  if (!userId) return apiError("Not authenticated.", 401);

  const { id } = await context.params;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      payload?: Record<string, unknown>;
      saveFirst?: boolean;
      name?: string;
      description?: string;
      nodes?: WorkflowNode[];
    };

    if (body.saveFirst && body.nodes) {
      await automationRepository.updateWorkflow(
        userId,
        id,
        {
          name: body.name,
          description: body.description,
          nodes: body.nodes,
          changeNote: "Saved before test run",
        },
        userId
      );
    }

    const result = await automationRepository.runTest(userId, id, body.payload);
    if (!result) return apiError("Workflow not found.", 404);

    return apiOk({ run: result.run, logs: result.logs });
  } catch (error) {
    console.error("[automations/test] failed:", error);
    return apiError(error instanceof Error ? error.message : "Test run failed.");
  }
}
