import { NextRequest } from "next/server";
import { getAutomationUserId } from "@/lib/automations/auth";
import { ensureSampleWorkflows, verifyAutomationEngine } from "@/lib/automations/ensure-samples";
import { apiError, apiOk } from "@/lib/automations/api-utils";

export async function POST(request: NextRequest) {
  const userId = await getAutomationUserId();
  if (!userId) return apiError("Not authenticated.", 401);

  try {
    const verify = request.nextUrl.searchParams.get("verify") === "1";
    const seed = await ensureSampleWorkflows(userId, userId);

    if (verify) {
      const report = await verifyAutomationEngine(userId);
      return apiOk({ seed, verification: report });
    }

    return apiOk({ seed });
  } catch (error) {
    console.error("[automations/seed] failed:", error);
    return apiError(error instanceof Error ? error.message : "Failed to seed workflows.");
  }
}
