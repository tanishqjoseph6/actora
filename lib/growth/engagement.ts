import "server-only";

import { createUserNotification } from "@/lib/notifications/repository";
import {
  getStreak,
  listAchievements,
  recordDailyActivity,
  unlockAchievement,
} from "./repository";
import { processReferralActivation } from "./rewards";
import type { AchievementId } from "./types";
import { ACHIEVEMENTS } from "./types";

export type WorkspaceProgress = {
  percent: number;
  steps: { id: string; label: string; done: boolean }[];
};

/**
 * Track engagement: streak + optional achievement unlock.
 * Safe to call fire-and-forget from product events.
 */
export async function trackEngagement(input: {
  userId: string;
  achievementId?: AchievementId;
  activateReferral?: boolean;
}): Promise<{ unlocked: boolean }> {
  try {
    const streak = await recordDailyActivity(input.userId);

    if (streak.currentStreak >= 7) {
      await unlockAchievement({
        userId: input.userId,
        achievementId: "streak_7",
      });
    }
    if (streak.currentStreak >= 30) {
      await unlockAchievement({
        userId: input.userId,
        achievementId: "streak_30",
      });
    }

    let unlocked = false;
    if (input.achievementId) {
      const before = await listAchievements(input.userId);
      const had = before.some((a) => a.achievementId === input.achievementId);
      const result = await unlockAchievement({
        userId: input.userId,
        achievementId: input.achievementId,
      });
      unlocked = Boolean(result) && !had;

      if (unlocked) {
        const def = ACHIEVEMENTS.find((a) => a.id === input.achievementId);
        await createUserNotification(input.userId, {
          category: "Growth",
          title: def ? `Achievement: ${def.title}` : "Achievement unlocked",
          body: def?.description ?? "You unlocked a new Actora badge.",
          href: "/dashboard/settings#achievements",
        });
      }
    }

    if (input.activateReferral) {
      await processReferralActivation(input.userId);
    }

    return { unlocked };
  } catch (error) {
    console.error("[growth/engagement]", error);
    return { unlocked: false };
  }
}

export async function getEngagementSummary(userId: string) {
  const [achievements, streak] = await Promise.all([
    listAchievements(userId),
    getStreak(userId),
  ]);

  const unlockedIds = new Set(achievements.map((a) => a.achievementId));
  const badges = ACHIEVEMENTS.map((def) => ({
    ...def,
    unlocked: unlockedIds.has(def.id),
    unlockedAt:
      achievements.find((a) => a.achievementId === def.id)?.unlockedAt ?? null,
  }));

  return { badges, streak, unlockedCount: achievements.length };
}

export function computeWorkspaceProgress(flags: {
  hasWorkspace: boolean;
  hasGmail: boolean;
  hasCalendar: boolean;
  hasTeammate: boolean;
  hasAiPrompt: boolean;
  hasAutomation: boolean;
}): WorkspaceProgress {
  const steps = [
    { id: "workspace", label: "Create workspace", done: flags.hasWorkspace },
    { id: "gmail", label: "Connect Gmail", done: flags.hasGmail },
    { id: "calendar", label: "Connect calendar", done: flags.hasCalendar },
    { id: "teammate", label: "Invite teammate", done: flags.hasTeammate },
    { id: "ai", label: "Ask Roxx AI", done: flags.hasAiPrompt },
    { id: "automation", label: "Create automation", done: flags.hasAutomation },
  ];
  const done = steps.filter((s) => s.done).length;
  return {
    percent: Math.round((done / steps.length) * 100),
    steps,
  };
}
