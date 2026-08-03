import { NextRequest, NextResponse } from "next/server";
import { requireWorkspacePermission } from "@/lib/workspace/require";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getStoredSubscription } from "@/lib/subscription/repository";
import { getPublicApiLimits, getPublicApiMonthStart, getPublicApiNextReset } from "@/lib/public-api/limits";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspacePermission("settings", request);
  if (!auth.ok) return auth.response;
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const subscription = await getStoredSubscription(auth.email);
  const planId = subscription?.planId ?? "free";
  const limits = getPublicApiLimits(planId);
  const monthStart = getPublicApiMonthStart();
  const { data, error } = await db.from("api_usage_monthly")
    .select("calls_count,api_key_id")
    .eq("workspace_id", auth.ctx.workspaceId)
    .eq("month_start", monthStart.slice(0, 10));
  if (error) return NextResponse.json({ error: "Could not load API usage." }, { status: 500 });
  const used = (data ?? []).reduce((sum, row) => sum + Number(row.calls_count ?? 0), 0);
  return NextResponse.json({
    usage: {
      planId,
      planName: planId === "starter" ? "Team" : planId === "trial" ? "Free" : planId[0].toUpperCase() + planId.slice(1),
      callsUsed: used,
      callsRemaining: Number.isFinite(limits.monthlyCalls) ? Math.max(0, limits.monthlyCalls - used) : null,
      monthlyLimit: Number.isFinite(limits.monthlyCalls) ? limits.monthlyCalls : null,
      rateLimit: limits.requestsPerMinute,
      nextResetAt: getPublicApiNextReset(),
      activeKeys: new Set((data ?? []).map((row) => row.api_key_id)).size,
    },
  });
}
