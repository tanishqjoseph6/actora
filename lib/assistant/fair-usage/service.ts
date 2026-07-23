import "server-only";

import { getPlanDisplayName } from "@/lib/subscription/plans";
import type { PlanId } from "@/lib/subscription";
import {
  getDefaultFairUsageConfig,
  getFairUsageUpgradePlan,
} from "./defaults";
import {
  getRoxxSession,
  insertCooldownHistory,
  insertSessionHistory,
  loadFairUsageConfig,
  updateRoxxSession,
  upsertRoxxSession,
} from "./repository";
import type { RoxxFairUsageStatus, RoxxSessionRow } from "./types";

function nowMs() {
  return Date.now();
}

function secondsBetween(startIso: string, endMs = nowMs()) {
  return Math.max(0, Math.floor((endMs - new Date(startIso).getTime()) / 1000));
}

function cooldownRemainingSeconds(cooldownUntil: string | null, atMs = nowMs()) {
  if (!cooldownUntil) return 0;
  const diff = Math.ceil((new Date(cooldownUntil).getTime() - atMs) / 1000);
  return Math.max(0, diff);
}

function buildStatus(
  planId: PlanId,
  config: ReturnType<typeof getDefaultFairUsageConfig>,
  session: RoxxSessionRow | null
): RoxxFairUsageStatus {
  const at = nowMs();
  const cooldownEndsAt = session?.cooldown_until ?? null;
  const cooldownRemaining = cooldownRemainingSeconds(cooldownEndsAt, at);
  const inCooldown = cooldownRemaining > 0;

  const sessionStartedAt = session?.session_started_at ?? null;
  const continuousSecondsUsed =
    !inCooldown && sessionStartedAt
      ? secondsBetween(sessionStartedAt, at)
      : 0;

  const unlimited = config.unlimited || !config.enabled;
  const atLimit =
    !unlimited &&
    config.continuousLimitSeconds != null &&
    continuousSecondsUsed >= config.continuousLimitSeconds;

  return {
    allowed: unlimited || (!inCooldown && !atLimit),
    inCooldown,
    unlimited,
    planId,
    planName: getPlanDisplayName(planId),
    upgradePlan: getFairUsageUpgradePlan(planId),
    sessionStartedAt,
    lastActivityAt: session?.last_activity_at ?? null,
    continuousSecondsUsed,
    continuousLimitSeconds: config.continuousLimitSeconds,
    cooldownEndsAt: inCooldown ? cooldownEndsAt : null,
    cooldownRemainingSeconds: cooldownRemaining,
    inactivityResetSeconds: config.inactivityResetSeconds,
    messageCount: session?.message_count ?? 0,
    totalTokens: session?.total_tokens ?? 0,
    lastModel: session?.last_model ?? null,
  };
}

async function archiveSession(
  userId: string,
  session: RoxxSessionRow,
  endReason: "limit_reached" | "inactivity_reset" | "cooldown_started",
  endedAt: string
) {
  const continuousSecondsUsed = secondsBetween(
    session.session_started_at,
    new Date(endedAt).getTime()
  );

  if (session.message_count > 0 || continuousSecondsUsed > 0) {
    await insertSessionHistory({
      userId,
      sessionStartedAt: session.session_started_at,
      sessionEndedAt: endedAt,
      endReason,
      continuousSecondsUsed,
      messageCount: session.message_count,
      totalTokens: session.total_tokens,
      lastModel: session.last_model,
      planId: session.plan_id as PlanId,
    });
  }
}

async function startCooldown(
  userId: string,
  planId: PlanId,
  session: RoxxSessionRow,
  config: ReturnType<typeof getDefaultFairUsageConfig>
) {
  const startedAt = new Date().toISOString();
  const endsAt = new Date(
    Date.now() + config.cooldownSeconds * 1000
  ).toISOString();

  await archiveSession(userId, session, "cooldown_started", startedAt);

  await insertCooldownHistory({
    userId,
    startedAt,
    endsAt,
    durationSeconds: config.cooldownSeconds,
    planId,
    sessionMessageCount: session.message_count,
    sessionTokens: session.total_tokens,
    lastModel: session.last_model,
  });

  await updateRoxxSession(userId, {
    cooldown_until: endsAt,
    session_started_at: startedAt,
    last_activity_at: startedAt,
    message_count: 0,
    total_tokens: 0,
    last_model: null,
    plan_id: planId,
  });
}

async function resetSessionAfterInactivity(
  userId: string,
  planId: PlanId,
  session: RoxxSessionRow
) {
  const endedAt = new Date().toISOString();
  await archiveSession(userId, session, "inactivity_reset", endedAt);

  await updateRoxxSession(userId, {
    session_started_at: endedAt,
    last_activity_at: endedAt,
    message_count: 0,
    total_tokens: 0,
    last_model: null,
    plan_id: planId,
    cooldown_until: null,
  });
}

async function syncSession(
  userId: string,
  planId: PlanId
): Promise<{ config: Awaited<ReturnType<typeof loadFairUsageConfig>>; session: RoxxSessionRow | null }> {
  const config = await loadFairUsageConfig(planId);
  let session = await getRoxxSession(userId);
  const now = new Date().toISOString();

  if (config.unlimited || !config.enabled) {
    return { config, session };
  }

  if (session?.cooldown_until) {
    const remaining = cooldownRemainingSeconds(session.cooldown_until);
    if (remaining <= 0) {
      session = await updateRoxxSession(userId, {
        cooldown_until: null,
        session_started_at: now,
        last_activity_at: now,
        message_count: 0,
        total_tokens: 0,
        plan_id: planId,
      });
    }
    return { config, session };
  }

  if (!session) {
    session = await upsertRoxxSession(userId, {
      plan_id: planId,
      session_started_at: now,
      last_activity_at: now,
      cooldown_until: null,
      message_count: 0,
      total_tokens: 0,
    });
    return { config, session };
  }

  const inactiveFor = secondsBetween(
    session.last_activity_at,
    nowMs()
  );
  if (
    inactiveFor >= config.inactivityResetSeconds &&
    (session.message_count > 0 || secondsBetween(session.session_started_at) > 0)
  ) {
    await resetSessionAfterInactivity(userId, planId, session);
    session = await getRoxxSession(userId);
  }

  return { config, session };
}

export async function getRoxxFairUsageStatus(
  userId: string,
  planId: PlanId
): Promise<RoxxFairUsageStatus> {
  const { config, session } = await syncSession(userId, planId);
  let current = session;

  if (
    !config.unlimited &&
    config.enabled &&
    current &&
    !current.cooldown_until &&
    config.continuousLimitSeconds != null
  ) {
    const elapsed = secondsBetween(current.session_started_at);
    if (elapsed >= config.continuousLimitSeconds) {
      await startCooldown(userId, planId, current, config);
      current = await getRoxxSession(userId);
    }
  }

  return buildStatus(planId, config, current);
}

export async function assertRoxxFairUsageAllowed(
  userId: string,
  planId: PlanId
): Promise<{ ok: true } | { ok: false; status: RoxxFairUsageStatus }> {
  const { config, session } = await syncSession(userId, planId);

  if (config.unlimited || !config.enabled) {
    return { ok: true };
  }

  let current = session;
  const statusBefore = buildStatus(planId, config, current);

  if (statusBefore.inCooldown) {
    return { ok: false, status: statusBefore };
  }

  if (
    config.continuousLimitSeconds != null &&
    statusBefore.continuousSecondsUsed >= config.continuousLimitSeconds
  ) {
    if (current) {
      await startCooldown(userId, planId, current, config);
    }
    const blocked = await getRoxxFairUsageStatus(userId, planId);
    return { ok: false, status: blocked };
  }

  const now = new Date().toISOString();
  if (!current) {
    current = await upsertRoxxSession(userId, {
      plan_id: planId,
      session_started_at: now,
      last_activity_at: now,
    });
  } else {
    const inactiveFor = secondsBetween(current.last_activity_at);
    const freshSession =
      inactiveFor >= config.inactivityResetSeconds ||
      current.message_count === 0;

    await updateRoxxSession(userId, {
      session_started_at: freshSession ? now : current.session_started_at,
      last_activity_at: now,
      plan_id: planId,
    });
  }

  return { ok: true };
}

export async function recordRoxxAiMessageComplete(
  userId: string,
  planId: PlanId,
  input: { tokens: number; model: string }
) {
  const config = await loadFairUsageConfig(planId);
  if (config.unlimited || !config.enabled) {
    const session = await getRoxxSession(userId);
    if (!session) {
      await upsertRoxxSession(userId, {
        plan_id: planId,
        message_count: 1,
        total_tokens: input.tokens,
        last_model: input.model,
      });
    } else {
      await updateRoxxSession(userId, {
        message_count: session.message_count + 1,
        total_tokens: session.total_tokens + Math.max(0, input.tokens),
        last_model: input.model,
        last_activity_at: new Date().toISOString(),
        plan_id: planId,
      });
    }
    return;
  }

  const session = await getRoxxSession(userId);
  if (!session) return;

  await updateRoxxSession(userId, {
    message_count: session.message_count + 1,
    total_tokens: session.total_tokens + Math.max(0, input.tokens),
    last_model: input.model,
    last_activity_at: new Date().toISOString(),
    plan_id: planId,
  });
}

export function fairUsageBlockedMessage(status: RoxxFairUsageStatus): string {
  if (status.inCooldown) {
    return "You've reached your continuous AI session limit. Please wait before continuing.";
  }
  return "Continuous Roxx AI session limit reached.";
}
