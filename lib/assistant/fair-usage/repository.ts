import "server-only";

import {
  getSupabaseAdmin,
  isSupabaseNetworkError,
} from "@/lib/supabase-admin";
import type { PlanId } from "@/lib/subscription";
import {
  getDefaultFairUsageConfig,
} from "./defaults";
import type {
  FairUsagePlanConfig,
  RoxxSessionRow,
  SessionEndReason,
} from "./types";

type ConfigRow = {
  plan_id: string;
  continuous_limit_seconds: number | null;
  cooldown_seconds: number;
  inactivity_reset_seconds: number;
  enabled: boolean;
};

export function isMissingRoxxFairUsageSchemaError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("roxx_ai_sessions") ||
    lower.includes("roxx_ai_fair_usage_config") ||
    lower.includes("roxx_ai_session_history") ||
    lower.includes("roxx_ai_cooldown_history")
  );
}

export async function loadFairUsageConfig(
  planId: PlanId
): Promise<FairUsagePlanConfig> {
  const fallback = getDefaultFairUsageConfig(planId);
  const supabase = getSupabaseAdmin();
  if (!supabase) return fallback;

  const { data, error } = await supabase
    .from("roxx_ai_fair_usage_config")
    .select(
      "plan_id, continuous_limit_seconds, cooldown_seconds, inactivity_reset_seconds, enabled"
    )
    .eq("plan_id", planId)
    .maybeSingle();

  if (error) {
    if (isMissingRoxxFairUsageSchemaError(error.message)) return fallback;
    console.error("[roxx-fair-usage] config load failed:", error.message);
    return fallback;
  }

  if (!data) return fallback;

  const row = data as ConfigRow;
  const unlimited = row.continuous_limit_seconds == null;
  return {
    planId,
    continuousLimitSeconds: row.continuous_limit_seconds,
    cooldownSeconds: row.cooldown_seconds,
    inactivityResetSeconds: row.inactivity_reset_seconds,
    enabled: row.enabled,
    unlimited,
  };
}

export async function getRoxxSession(
  userId: string
): Promise<RoxxSessionRow | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("roxx_ai_sessions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (
      isMissingRoxxFairUsageSchemaError(error.message) ||
      isSupabaseNetworkError(error.message)
    ) {
      return null;
    }
    throw new Error(error.message);
  }

  return (data as RoxxSessionRow | null) ?? null;
}

export async function upsertRoxxSession(
  userId: string,
  patch: Partial<RoxxSessionRow> & { plan_id: PlanId }
): Promise<RoxxSessionRow | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("roxx_ai_sessions")
    .upsert(
      {
        user_id: userId,
        session_started_at: patch.session_started_at ?? now,
        last_activity_at: patch.last_activity_at ?? now,
        cooldown_until: patch.cooldown_until ?? null,
        message_count: patch.message_count ?? 0,
        total_tokens: patch.total_tokens ?? 0,
        last_model: patch.last_model ?? null,
        plan_id: patch.plan_id,
        updated_at: now,
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (error) {
    if (isMissingRoxxFairUsageSchemaError(error.message)) return null;
    throw new Error(error.message);
  }

  return data as RoxxSessionRow;
}

export async function updateRoxxSession(
  userId: string,
  patch: Partial<RoxxSessionRow>
): Promise<RoxxSessionRow | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("roxx_ai_sessions")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    if (isMissingRoxxFairUsageSchemaError(error.message)) return null;
    throw new Error(error.message);
  }

  return (data as RoxxSessionRow | null) ?? null;
}

export async function insertSessionHistory(input: {
  userId: string;
  sessionStartedAt: string;
  sessionEndedAt: string;
  endReason: SessionEndReason;
  continuousSecondsUsed: number;
  messageCount: number;
  totalTokens: number;
  lastModel: string | null;
  planId: PlanId;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const { error } = await supabase.from("roxx_ai_session_history").insert({
    user_id: input.userId,
    session_started_at: input.sessionStartedAt,
    session_ended_at: input.sessionEndedAt,
    end_reason: input.endReason,
    continuous_seconds_used: input.continuousSecondsUsed,
    message_count: input.messageCount,
    total_tokens: input.totalTokens,
    last_model: input.lastModel,
    plan_id: input.planId,
  });

  if (error && !isMissingRoxxFairUsageSchemaError(error.message)) {
    console.error("[roxx-fair-usage] session history insert failed:", error.message);
  }
}

export async function insertCooldownHistory(input: {
  userId: string;
  startedAt: string;
  endsAt: string;
  durationSeconds: number;
  planId: PlanId;
  triggerReason?: string;
  sessionMessageCount: number;
  sessionTokens: number;
  lastModel: string | null;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const { error } = await supabase.from("roxx_ai_cooldown_history").insert({
    user_id: input.userId,
    started_at: input.startedAt,
    ends_at: input.endsAt,
    duration_seconds: input.durationSeconds,
    plan_id: input.planId,
    trigger_reason: input.triggerReason ?? "continuous_limit",
    session_message_count: input.sessionMessageCount,
    session_tokens: input.sessionTokens,
    last_model: input.lastModel,
  });

  if (error && !isMissingRoxxFairUsageSchemaError(error.message)) {
    console.error("[roxx-fair-usage] cooldown history insert failed:", error.message);
  }
}
