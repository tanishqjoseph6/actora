import { NextRequest, NextResponse } from "next/server";
import { requireWorkspacePermission } from "@/lib/workspace/require";
import { getWorkspaceUsage } from "@/lib/workspace/usage-repository";
import { getPlanLimits } from "@/lib/subscription/plans";

export async function GET(request: NextRequest) {
  try {
  const auth = await requireWorkspacePermission("files", request);
  if (!auth.ok) {
    return auth.response;
  }
  let snapshot;
  try {
    snapshot = await getWorkspaceUsage(auth.ctx.workspaceId, auth.email);
  } catch (error) {
    console.error("[developers/usage] Falling back to empty usage:", error);
    const limits = getPlanLimits("free");
    snapshot = {
      planId: "free" as const,
      nextResetAt: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1)).toISOString(),
      storage: { usedBytes: 0, limitBytes: limits.storageBytes, fileCount: 0, percent: 0, remainingBytes: limits.storageBytes },
      api: { callsUsed: 0, monthlyLimit: limits.publicApiCallsPerMonth, rateLimit: limits.publicApiRequestsPerMinute, remaining: limits.publicApiCallsPerMonth, percent: 0, activeKeys: 0 },
      aiCredits: { used: 0, limit: limits.aiActionsPerMonth, remaining: limits.aiActionsPerMonth, percent: 0 },
      teamMembers: { used: 0, limit: 1, remaining: 1, percent: 0 },
      workspaces: { used: 0, limit: 1, remaining: 1, percent: 0 },
      automationRuns: 0, tasks: 0, documents: 0, crmContacts: 0, meetings: 0, calendarEvents: 0,
    };
  }
  const { api, nextResetAt, planId } = snapshot;
  return NextResponse.json({
    usage: {
      planId,
      planName: planId === "starter" ? "Team" : planId === "trial" ? "Free" : planId[0].toUpperCase() + planId.slice(1),
      callsUsed: api.callsUsed,
      callsRemaining: api.remaining,
      monthlyLimit: Number.isFinite(api.monthlyLimit) ? api.monthlyLimit : null,
      rateLimit: api.rateLimit,
      nextResetAt,
      activeKeys: api.activeKeys,
      storage: snapshot.storage,
      aiCredits: snapshot.aiCredits,
      teamMembers: snapshot.teamMembers,
      workspaces: snapshot.workspaces,
      automationRuns: snapshot.automationRuns,
      tasks: snapshot.tasks,
      documents: snapshot.documents,
      crmContacts: snapshot.crmContacts,
      meetings: snapshot.meetings,
      calendarEvents: snapshot.calendarEvents,
    },
  });
  } catch (error) {
    console.error("[developers/usage] Route failed; returning empty usage:", error);
    const limits = getPlanLimits("free");
    return NextResponse.json({
      usage: {
        planId: "free",
        planName: "Free",
        callsUsed: 0,
        callsRemaining: limits.publicApiCallsPerMonth,
        monthlyLimit: limits.publicApiCallsPerMonth,
        rateLimit: limits.publicApiRequestsPerMinute,
        nextResetAt: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1)).toISOString(),
        activeKeys: 0,
        storage: { usedBytes: 0, limitBytes: limits.storageBytes, fileCount: 0, percent: 0, remainingBytes: limits.storageBytes },
        aiCredits: { used: 0, limit: limits.aiActionsPerMonth, remaining: limits.aiActionsPerMonth, percent: 0 },
        teamMembers: { used: 0, limit: 1, remaining: 1, percent: 0 },
        workspaces: { used: 0, limit: 1, remaining: 1, percent: 0 },
        automationRuns: 0, tasks: 0, documents: 0, crmContacts: 0, meetings: 0, calendarEvents: 0,
      },
    });
  }
}
