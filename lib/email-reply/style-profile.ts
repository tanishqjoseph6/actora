import { getSupabaseAdmin, requireSupabaseAdmin } from "@/lib/supabase-admin";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import {
  emptyStyleProfile,
  type WritingStyleProfileData,
} from "./prompts";

export type WritingStylePublicStatus = {
  enabled: boolean;
  ready: boolean;
  sampleCount: number;
  lastLearnedAt: string | null;
};

type StyleRow = {
  id: string;
  user_id: string;
  enabled: boolean;
  profile: WritingStyleProfileData | Record<string, unknown>;
  sample_count: number;
  last_learned_at: string | null;
};

function mapPublic(row: StyleRow | null): WritingStylePublicStatus {
  if (!row) {
    return {
      enabled: false,
      ready: false,
      sampleCount: 0,
      lastLearnedAt: null,
    };
  }
  const profile = row.profile as WritingStyleProfileData;
  const ready =
    row.sample_count >= 3 &&
    Boolean(profile?.greetingStyle || profile?.personalityNotes);
  return {
    enabled: row.enabled,
    ready,
    sampleCount: row.sample_count,
    lastLearnedAt: row.last_learned_at,
  };
}

export async function getWritingStyleStatus(
  userId: string
): Promise<WritingStylePublicStatus> {
  const db = getSupabaseAdmin();
  if (!db) return mapPublic(null);

  const uid = normalizeSubscriptionUserId(userId);
  const { data } = await db
    .from("writing_style_profiles")
    .select("id, user_id, enabled, profile, sample_count, last_learned_at")
    .eq("user_id", uid)
    .eq("scope", "personal")
    .maybeSingle();

  return mapPublic((data as StyleRow | null) ?? null);
}

/**
 * Server-only: load full style profile for prompt injection.
 * Never expose this object through an API response.
 */
export async function getWritingStyleProfileInternal(
  userId: string
): Promise<{
  enabled: boolean;
  profile: WritingStyleProfileData | null;
  sampleCount: number;
} | null> {
  const db = getSupabaseAdmin();
  if (!db) return null;

  const uid = normalizeSubscriptionUserId(userId);
  const { data } = await db
    .from("writing_style_profiles")
    .select("enabled, profile, sample_count")
    .eq("user_id", uid)
    .eq("scope", "personal")
    .maybeSingle();

  if (!data) return { enabled: false, profile: null, sampleCount: 0 };

  return {
    enabled: Boolean(data.enabled),
    profile: (data.profile as WritingStyleProfileData) ?? null,
    sampleCount: Number(data.sample_count ?? 0),
  };
}

export async function setWritingStyleEnabled(
  userId: string,
  enabled: boolean
): Promise<WritingStylePublicStatus> {
  const db = requireSupabaseAdmin();
  const uid = normalizeSubscriptionUserId(userId);

  const { data: existing } = await db
    .from("writing_style_profiles")
    .select("id, profile")
    .eq("user_id", uid)
    .eq("scope", "personal")
    .maybeSingle();

  if (existing?.id) {
    await db
      .from("writing_style_profiles")
      .update({
        enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await db.from("writing_style_profiles").insert({
      user_id: uid,
      scope: "personal",
      enabled,
      profile: emptyStyleProfile(),
      sample_count: 0,
    });
  }

  return getWritingStyleStatus(uid);
}

export async function upsertLearnedStyleProfile(input: {
  userId: string;
  profile: WritingStyleProfileData;
  sampleCount: number;
}): Promise<WritingStylePublicStatus> {
  const db = requireSupabaseAdmin();
  const uid = normalizeSubscriptionUserId(input.userId);
  const now = new Date().toISOString();

  const { data: existing } = await db
    .from("writing_style_profiles")
    .select("id, enabled")
    .eq("user_id", uid)
    .eq("scope", "personal")
    .maybeSingle();

  if (existing?.id) {
    await db
      .from("writing_style_profiles")
      .update({
        profile: input.profile,
        sample_count: input.sampleCount,
        last_learned_at: now,
        updated_at: now,
      })
      .eq("id", existing.id);
  } else {
    await db.from("writing_style_profiles").insert({
      user_id: uid,
      scope: "personal",
      enabled: false,
      profile: input.profile,
      sample_count: input.sampleCount,
      last_learned_at: now,
    });
  }

  return getWritingStyleStatus(uid);
}
