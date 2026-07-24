import {
  getSupabaseAdmin,
  isMissingUserUsageSchemaError,
  isSupabaseNetworkError,
} from "@/lib/supabase-admin";
import { isUnlimited } from "@/lib/subscription/plans";
import {
  getAiCreditCost,
  type AiCreditFeature,
} from "@/lib/ai-credits/costs";
import { resolveCreditCycle } from "@/lib/ai-credits/cycle";
import {
  getUserUsage,
  type UserUsage,
} from "@/lib/dashboard/user-usage";

async function notifyUsageMilestones(userId: string) {
  try {
    const { evaluateAiCreditUsageNotifications } = await import(
      "@/lib/ai-credits/usage-notifications"
    );
    await evaluateAiCreditUsageNotifications(userId);
  } catch (err) {
    console.error("[ai-credits] usage notifications failed:", err);
  }
}

export type ConsumeCreditsResult =
  | {
      ok: true;
      usage: UserUsage;
      remaining: number;
      allotment: number;
      monthlyRemaining: number;
      purchasedRemaining: number;
    }
  | {
      ok: false;
      code: "INSUFFICIENT_CREDITS" | "UNAUTHENTICATED" | "ERROR";
      reason: string;
      remaining: number;
      allotment: number;
      monthlyRemaining: number;
      purchasedRemaining: number;
    };

export type AiCreditLedgerEntry = {
  id: string;
  userId: string;
  feature: string;
  credits: number;
  balanceAfter: number;
  metadata: Record<string, unknown>;
  createdAt: string;
};

function totalsFromUsage(usage: UserUsage, allotment: number) {
  const monthlyRemaining = isUnlimited(allotment)
    ? Number.POSITIVE_INFINITY
    : Math.max(0, allotment - usage.aiActionsUsed);
  const purchasedRemaining = Math.max(0, usage.purchasedCreditsRemaining);
  const remaining = isUnlimited(allotment)
    ? Number.POSITIVE_INFINITY
    : monthlyRemaining + purchasedRemaining;
  return { monthlyRemaining, purchasedRemaining, remaining };
}

async function ensureCycleSynced(userId: string): Promise<UserUsage> {
  const cycle = await resolveCreditCycle(userId);
  return getUserUsage(userId, {
    cycleKey: cycle.cycleKey,
    periodStart: cycle.periodStart,
    periodEnd: cycle.periodEnd,
    allotment: cycle.allotment,
  });
}

async function appendLedger(entry: {
  userId: string;
  feature: AiCreditFeature;
  credits: number;
  balanceAfter: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const db = getSupabaseAdmin();
  if (!db) return;

  const { error } = await db.from("ai_credit_ledger").insert({
    user_id: entry.userId,
    feature: entry.feature,
    credits: entry.credits,
    balance_after: entry.balanceAfter,
    metadata: entry.metadata ?? {},
  });

  if (error && !isMissingUserUsageSchemaError(error.message)) {
    console.error("[ai-credits] ledger insert failed:", error.message);
  }
}

async function consumeFromPools(
  userId: string,
  credits: number,
  cycle: Awaited<ReturnType<typeof resolveCreditCycle>>,
  feature: AiCreditFeature,
  incrementReplies: boolean
): Promise<ConsumeCreditsResult> {
  const current = await ensureCycleSynced(userId);
  const allotment = current.aiCreditsAllotment || cycle.allotment;
  const pools = totalsFromUsage(current, allotment);

  if (pools.remaining < credits) {
    return {
      ok: false,
      code: "INSUFFICIENT_CREDITS",
      reason:
        "You've used all available AI credits (monthly + purchased). Buy more credits or upgrade your plan.",
      remaining: pools.remaining,
      allotment,
      monthlyRemaining: pools.monthlyRemaining,
      purchasedRemaining: pools.purchasedRemaining,
    };
  }

  const fromMonthly = Math.min(
    Number.isFinite(pools.monthlyRemaining) ? pools.monthlyRemaining : credits,
    credits
  );
  const fromPurchased = credits - fromMonthly;

  const next = await getUserUsage(userId, {
    cycleKey: cycle.cycleKey,
    periodStart: cycle.periodStart,
    periodEnd: cycle.periodEnd,
    allotment,
    incrementBy: fromMonthly,
    incrementReplies,
  });

  let purchasedRemaining = next.purchasedCreditsRemaining;
  if (fromPurchased > 0) {
    purchasedRemaining = Math.max(0, purchasedRemaining - fromPurchased);
    const db = getSupabaseAdmin();
    if (db) {
      await db
        .from("user_usage")
        .update({
          purchased_credits_remaining: purchasedRemaining,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }
    next.purchasedCreditsRemaining = purchasedRemaining;
  }

  const after = totalsFromUsage(next, allotment);
  await appendLedger({
    userId,
    feature,
    credits,
    balanceAfter: Number.isFinite(after.remaining)
      ? after.remaining
      : Number.MAX_SAFE_INTEGER,
    metadata: { fromMonthly, fromPurchased },
  });

  void notifyUsageMilestones(userId);

  return {
    ok: true,
    usage: next,
    remaining: after.remaining,
    allotment,
    monthlyRemaining: after.monthlyRemaining,
    purchasedRemaining: after.purchasedRemaining,
  };
}

/**
 * Server-only: check balance, deduct credits (monthly first, then purchased), write ledger.
 * When a workspace is active, credits are billed to the workspace owner pool.
 */
export async function consumeAiCredits(
  userId: string,
  feature: AiCreditFeature,
  options?: {
    metadata?: Record<string, unknown>;
    credits?: number;
    /** Debit this pool instead of the actor (workspace owner). */
    creditUserId?: string;
    workspaceId?: string;
  }
): Promise<ConsumeCreditsResult> {
  if (!userId) {
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      reason: "Not authenticated.",
      remaining: 0,
      allotment: 0,
      monthlyRemaining: 0,
      purchasedRemaining: 0,
    };
  }

  const poolUserId = options?.creditUserId ?? userId;
  const credits = options?.credits ?? getAiCreditCost(feature);
  const cycle = await resolveCreditCycle(poolUserId);

  const ledgerMeta = {
    ...(options?.metadata ?? {}),
    ...(options?.workspaceId ? { workspaceId: options.workspaceId } : {}),
    ...(options?.creditUserId && options.creditUserId !== userId
      ? { actorUserId: userId }
      : {}),
  };

  if (isUnlimited(cycle.allotment)) {
    const next = await getUserUsage(poolUserId, {
      cycleKey: cycle.cycleKey,
      periodStart: cycle.periodStart,
      periodEnd: cycle.periodEnd,
      allotment: cycle.allotment,
      incrementBy: credits,
      incrementReplies: feature === "email_reply",
    });
    await appendLedger({
      userId: poolUserId,
      feature,
      credits,
      balanceAfter: Number.MAX_SAFE_INTEGER,
      metadata: ledgerMeta,
    });
    return {
      ok: true,
      usage: next,
      remaining: Number.POSITIVE_INFINITY,
      allotment: cycle.allotment,
      monthlyRemaining: Number.POSITIVE_INFINITY,
      purchasedRemaining: next.purchasedCreditsRemaining,
    };
  }

  const db = getSupabaseAdmin();

  if (db) {
    try {
      const { data, error } = await db.rpc("consume_ai_credits", {
        p_user_id: poolUserId,
        p_credits: credits,
        p_allotment: Number.isFinite(cycle.allotment)
          ? cycle.allotment
          : 2_147_483_647,
        p_cycle_key: cycle.cycleKey,
        p_period_start: cycle.periodStart,
        p_period_end: cycle.periodEnd,
      });

      if (!error && Array.isArray(data)) {
        if (data.length === 0) {
          const current = await ensureCycleSynced(poolUserId);
          const allotment = current.aiCreditsAllotment || cycle.allotment;
          const pools = totalsFromUsage(current, allotment);
          return {
            ok: false,
            code: "INSUFFICIENT_CREDITS",
            reason:
              "You've used all available AI credits (monthly + purchased). Buy more credits or upgrade your plan.",
            remaining: pools.remaining,
            allotment,
            monthlyRemaining: pools.monthlyRemaining,
            purchasedRemaining: pools.purchasedRemaining,
          };
        }

        const row = data[0] as {
          ai_actions_used: number;
          ai_credits_allotment: number;
          purchased_credits_remaining?: number;
          period_start: string;
          period_end: string | null;
          cycle_key: string;
        };

        const usage: UserUsage = {
          userId: poolUserId,
          aiActionsUsed: row.ai_actions_used,
          aiRepliesCount: 0,
          aiCreditsAllotment: row.ai_credits_allotment,
          purchasedCreditsRemaining: row.purchased_credits_remaining ?? 0,
          periodStart: row.period_start,
          periodEnd: row.period_end,
          cycleKey: row.cycle_key,
        };

        const pools = totalsFromUsage(usage, row.ai_credits_allotment);
        await appendLedger({
          userId: poolUserId,
          feature,
          credits,
          balanceAfter: Number.isFinite(pools.remaining)
            ? pools.remaining
            : Number.MAX_SAFE_INTEGER,
          metadata: ledgerMeta,
        });

        void notifyUsageMilestones(poolUserId);

        return {
          ok: true,
          usage,
          remaining: pools.remaining,
          allotment: row.ai_credits_allotment,
          monthlyRemaining: pools.monthlyRemaining,
          purchasedRemaining: pools.purchasedRemaining,
        };
      }
    } catch (err) {
      console.error("[ai-credits] RPC consume failed, falling back:", err);
    }
  }

  return consumeFromPools(
    poolUserId,
    credits,
    cycle,
    feature,
    feature === "email_reply"
  );
}

export async function getAiCreditLedger(
  userId: string,
  limit = 50
): Promise<AiCreditLedgerEntry[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];

  const { data, error } = await db
    .from("ai_credit_ledger")
    .select("id, user_id, feature, credits, balance_after, metadata, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (
      !isMissingUserUsageSchemaError(error.message) &&
      !isSupabaseNetworkError(error.message)
    ) {
      console.error("[ai-credits] ledger read failed:", error.message);
    }
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    userId: row.user_id as string,
    feature: row.feature as string,
    credits: row.credits as number,
    balanceAfter: row.balance_after as number,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  }));
}
