import {
  getSupabaseAdmin,
  isMissingUserUsageSchemaError,
  isSupabaseNetworkError,
} from "@/lib/supabase-admin";
import type { UserUsageRow } from "@/lib/supabase/database.types";

export type UserUsage = {
  userId: string;
  aiActionsUsed: number;
  aiRepliesCount: number;
  aiCreditsAllotment: number;
  periodStart: string;
  periodEnd: string | null;
  cycleKey: string | null;
};

export type UsageSyncOptions = {
  cycleKey?: string;
  periodStart?: string;
  periodEnd?: string | null;
  allotment?: number;
  incrementBy?: number;
  incrementReplies?: boolean;
};

const memoryUsage = new Map<string, UserUsage>();

function currentPeriodStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function mapRow(row: UserUsageRow): UserUsage {
  return {
    userId: row.user_id,
    aiActionsUsed: row.ai_actions_used ?? 0,
    aiRepliesCount: row.ai_replies_count ?? 0,
    aiCreditsAllotment: row.ai_credits_allotment ?? 100,
    periodStart: row.period_start,
    periodEnd: row.period_end ?? null,
    cycleKey: row.cycle_key ?? null,
  };
}

function defaultUsage(userId: string, allotment = 100): UserUsage {
  return {
    userId,
    aiActionsUsed: 0,
    aiRepliesCount: 0,
    aiCreditsAllotment: allotment,
    periodStart: currentPeriodStart(),
    periodEnd: null,
    cycleKey: null,
  };
}

function applyCycleReset(
  usage: UserUsage,
  options?: UsageSyncOptions
): UserUsage {
  if (!options?.cycleKey) return usage;
  if (usage.cycleKey === options.cycleKey) {
    return {
      ...usage,
      aiCreditsAllotment:
        options.allotment != null && Number.isFinite(options.allotment)
          ? options.allotment
          : usage.aiCreditsAllotment,
      periodEnd: options.periodEnd ?? usage.periodEnd,
    };
  }

  return {
    ...usage,
    aiActionsUsed: 0,
    aiRepliesCount: 0,
    aiCreditsAllotment:
      options.allotment != null && Number.isFinite(options.allotment)
        ? options.allotment
        : usage.aiCreditsAllotment,
    periodStart: options.periodStart ?? usage.periodStart,
    periodEnd: options.periodEnd ?? null,
    cycleKey: options.cycleKey,
  };
}

async function persistUsage(usage: UserUsage): Promise<UserUsage> {
  const db = getSupabaseAdmin();

  if (!db) {
    memoryUsage.set(usage.userId, usage);
    return usage;
  }

  const payload = {
    user_id: usage.userId,
    ai_actions_used: usage.aiActionsUsed,
    ai_replies_count: usage.aiRepliesCount,
    ai_credits_allotment: Number.isFinite(usage.aiCreditsAllotment)
      ? usage.aiCreditsAllotment
      : 2_147_483_647,
    period_start: usage.periodStart,
    period_end: usage.periodEnd,
    cycle_key: usage.cycleKey,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from("user_usage")
    .upsert(payload)
    .select("*")
    .single();

  if (error) {
    // Older schemas may not have the new columns — retry with base fields.
    if (
      isMissingUserUsageSchemaError(error.message) ||
      /ai_credits_allotment|period_end|cycle_key|column/i.test(error.message)
    ) {
      const { data: fallback, error: fallbackError } = await db
        .from("user_usage")
        .upsert({
          user_id: usage.userId,
          ai_actions_used: usage.aiActionsUsed,
          ai_replies_count: usage.aiRepliesCount,
          period_start: usage.periodStart,
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (fallbackError) {
        console.error("[user-usage] Failed to persist usage:", fallbackError.message);
        memoryUsage.set(usage.userId, usage);
        return usage;
      }

      memoryUsage.set(usage.userId, usage);
      return {
        ...mapRow(fallback as UserUsageRow),
        aiCreditsAllotment: usage.aiCreditsAllotment,
        periodEnd: usage.periodEnd,
        cycleKey: usage.cycleKey,
      };
    }

    console.error("[user-usage] Failed to persist usage:", error.message);
    memoryUsage.set(usage.userId, usage);
    return usage;
  }

  const mapped = mapRow(data as UserUsageRow);
  memoryUsage.set(usage.userId, mapped);
  return mapped;
}

/**
 * Load usage, optionally syncing billing cycle / allotment and incrementing credits.
 */
export async function getUserUsage(
  userId: string,
  options?: UsageSyncOptions
): Promise<UserUsage> {
  const db = getSupabaseAdmin();
  let usage: UserUsage;

  if (!db) {
    usage = memoryUsage.get(userId) ?? defaultUsage(userId, options?.allotment);
  } else {
    const { data, error } = await db
      .from("user_usage")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      if (isMissingUserUsageSchemaError(error.message)) {
        usage = memoryUsage.get(userId) ?? defaultUsage(userId, options?.allotment);
      } else if (isSupabaseNetworkError(error.message)) {
        console.error("[user-usage] Supabase network error on read:", error.message);
        usage = memoryUsage.get(userId) ?? defaultUsage(userId, options?.allotment);
      } else {
        throw new Error(error.message);
      }
    } else if (!data) {
      usage = defaultUsage(userId, options?.allotment ?? 100);
      usage = applyCycleReset(usage, options);
      return persistUsage(usage);
    } else {
      usage = mapRow(data as UserUsageRow);
    }
  }

  // Legacy calendar-month reset when no cycle_key is tracked yet
  if (!options?.cycleKey && !usage.cycleKey) {
    const period = currentPeriodStart();
    if (usage.periodStart !== period) {
      usage = {
        ...defaultUsage(userId, usage.aiCreditsAllotment || options?.allotment || 100),
        periodStart: period,
      };
    }
  }

  usage = applyCycleReset(usage, options);

  if (options?.incrementBy && options.incrementBy > 0) {
    usage = {
      ...usage,
      aiActionsUsed: usage.aiActionsUsed + options.incrementBy,
      aiRepliesCount: options.incrementReplies
        ? usage.aiRepliesCount + 1
        : usage.aiRepliesCount,
    };
  }

  const dirty =
    Boolean(options?.cycleKey) ||
    Boolean(options?.incrementBy) ||
    Boolean(options?.allotment);

  if (dirty) {
    return persistUsage(usage);
  }

  memoryUsage.set(userId, usage);
  return usage;
}

/** @deprecated Prefer consumeAiCredits — kept for subscription provider compat */
export async function recordAiAction(userId: string): Promise<UserUsage> {
  const current = await getUserUsage(userId);
  return getUserUsage(userId, {
    cycleKey: current.cycleKey ?? undefined,
    periodStart: current.periodStart,
    periodEnd: current.periodEnd,
    allotment: current.aiCreditsAllotment,
    incrementBy: 1,
  });
}

/** @deprecated Prefer consumeAiCredits with feature email_reply */
export async function recordAiReply(userId: string): Promise<UserUsage> {
  const current = await getUserUsage(userId);
  return getUserUsage(userId, {
    cycleKey: current.cycleKey ?? undefined,
    periodStart: current.periodStart,
    periodEnd: current.periodEnd,
    allotment: current.aiCreditsAllotment,
    incrementBy: 1,
    incrementReplies: true,
  });
}
