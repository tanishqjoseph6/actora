import { getSupabaseAdmin } from "@/lib/supabase-admin";

type UserUsageRow = {
  user_id: string;
  ai_actions_used: number;
  ai_replies_count: number;
  period_start: string;
  updated_at: string;
};

export type UserUsage = {
  userId: string;
  aiActionsUsed: number;
  aiRepliesCount: number;
  periodStart: string;
};

const memoryUsage = new Map<string, UserUsage>();

function currentPeriodStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function mapRow(row: UserUsageRow): UserUsage {
  return {
    userId: row.user_id,
    aiActionsUsed: row.ai_actions_used,
    aiRepliesCount: row.ai_replies_count,
    periodStart: row.period_start,
  };
}

function defaultUsage(userId: string): UserUsage {
  return {
    userId,
    aiActionsUsed: 0,
    aiRepliesCount: 0,
    periodStart: currentPeriodStart(),
  };
}

async function resetIfNewPeriod(
  userId: string,
  usage: UserUsage
): Promise<UserUsage> {
  const period = currentPeriodStart();
  if (usage.periodStart === period) return usage;

  const reset = { ...defaultUsage(userId), periodStart: period };
  const db = getSupabaseAdmin();

  if (db) {
    await db.from("user_usage").upsert({
      user_id: userId,
      ai_actions_used: 0,
      ai_replies_count: 0,
      period_start: period,
      updated_at: new Date().toISOString(),
    });
  } else {
    memoryUsage.set(userId, reset);
  }

  return reset;
}

export async function getUserUsage(userId: string): Promise<UserUsage> {
  const db = getSupabaseAdmin();

  if (!db) {
    const existing = memoryUsage.get(userId) ?? defaultUsage(userId);
    return resetIfNewPeriod(userId, existing);
  }

  const { data, error } = await db
    .from("user_usage")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("user_usage") && msg.includes("does not exist")) {
      return memoryUsage.get(userId) ?? defaultUsage(userId);
    }
    throw new Error(error.message);
  }

  if (!data) {
    const created = defaultUsage(userId);
    await db.from("user_usage").insert({
      user_id: userId,
      ai_actions_used: 0,
      ai_replies_count: 0,
      period_start: created.periodStart,
    });
    return created;
  }

  const usage = mapRow(data as UserUsageRow);
  return resetIfNewPeriod(userId, usage);
}

export async function recordAiAction(userId: string): Promise<UserUsage> {
  const current = await getUserUsage(userId);
  const next = { ...current, aiActionsUsed: current.aiActionsUsed + 1 };
  return persistUsage(next);
}

export async function recordAiReply(userId: string): Promise<UserUsage> {
  const current = await getUserUsage(userId);
  const next = {
    ...current,
    aiActionsUsed: current.aiActionsUsed + 1,
    aiRepliesCount: current.aiRepliesCount + 1,
  };
  return persistUsage(next);
}

async function persistUsage(usage: UserUsage): Promise<UserUsage> {
  const db = getSupabaseAdmin();

  if (!db) {
    memoryUsage.set(usage.userId, usage);
    return usage;
  }

  const { data, error } = await db
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

  if (error) {
    memoryUsage.set(usage.userId, usage);
    return usage;
  }

  return mapRow(data as UserUsageRow);
}
