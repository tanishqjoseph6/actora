import { NextRequest, NextResponse } from "next/server";
import {
  getApiUserEmail,
  unauthenticatedJsonResponse,
} from "@/lib/auth/get-api-user";
import {
  getEngagementSummary,
  computeWorkspaceProgress,
} from "@/lib/growth/engagement";
import { unlockAchievement } from "@/lib/growth/repository";
import { listWorkspacesForUser } from "@/lib/workspace";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const email = await getApiUserEmail(request);
  if (!email) return unauthenticatedJsonResponse();

  try {
    const summary = await getEngagementSummary(email);
    const workspaces = await listWorkspacesForUser(email);
    const db = getSupabaseAdmin();

    let hasGmail = false;
    let hasCalendar = false;
    let hasTeammate = false;
    let hasAutomation = false;

    if (db) {
      const [gmail, calendar, members, automations] = await Promise.all([
        db
          .from("gmail_accounts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", email),
        db
          .from("calendar_accounts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", email),
        workspaces[0]
          ? db
              .from("workspace_members")
              .select("id", { count: "exact", head: true })
              .eq("workspace_id", workspaces[0].id)
              .eq("status", "active")
          : Promise.resolve({ count: 0 }),
        db
          .from("automations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", email),
      ]);

      hasGmail = (gmail.count ?? 0) > 0;
      hasCalendar = (calendar.count ?? 0) > 0;
      hasTeammate = (members.count ?? 0) > 1;
      hasAutomation = (automations.count ?? 0) > 0;
    }

    const hasAiPrompt = summary.badges.some(
      (b) => b.id === "first_ai_prompt" && b.unlocked
    );

    const progress = computeWorkspaceProgress({
      hasWorkspace: workspaces.length > 0,
      hasGmail,
      hasCalendar,
      hasTeammate,
      hasAiPrompt,
      hasAutomation,
    });

    if (progress.percent >= 50) {
      await unlockAchievement({
        userId: email,
        achievementId: "workspace_progress_50",
      });
    }
    if (progress.percent >= 100) {
      await unlockAchievement({
        userId: email,
        achievementId: "workspace_progress_100",
      });
    }

    return NextResponse.json({
      ...summary,
      progress,
    });
  } catch (error) {
    console.error("[api/growth/engagement]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load engagement." },
      { status: 500 }
    );
  }
}
