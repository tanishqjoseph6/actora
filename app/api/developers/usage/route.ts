import { NextRequest, NextResponse } from "next/server";
import { requireWorkspacePermission } from "@/lib/workspace/require";
import { getWorkspaceUsage } from "@/lib/workspace/usage-repository";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspacePermission("files", request);
  if (!auth.ok) return auth.response;
  const snapshot = await getWorkspaceUsage(auth.ctx.workspaceId, auth.email);
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
}
