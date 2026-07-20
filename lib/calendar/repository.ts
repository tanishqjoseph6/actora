import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import type {
  CalendarAccountPublic,
  CalendarAccountRecord,
  CalendarAccountStatus,
  CalendarProviderId,
} from "@/lib/calendar/types";

type CalendarAccountRow = {
  id: string;
  user_id: string;
  provider: string;
  account_email: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  scopes: string[] | null;
  connected_at: string;
  last_synced_at: string | null;
  last_sync_count: number;
  status: string;
  metadata: Record<string, unknown> | null;
};

const TABLE = "calendar_accounts";

function mapRow(row: CalendarAccountRow): CalendarAccountRecord {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider as CalendarProviderId,
    accountEmail: row.account_email,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    tokenExpiresAt: row.token_expires_at,
    scopes: row.scopes ?? [],
    connectedAt: row.connected_at,
    lastSyncedAt: row.last_synced_at,
    lastSyncCount: row.last_sync_count,
    status: row.status as CalendarAccountStatus,
    metadata: row.metadata ?? {},
  };
}

export function toPublicCalendarAccount(
  account: CalendarAccountRecord
): CalendarAccountPublic {
  return {
    id: account.id,
    provider: account.provider,
    accountEmail: account.accountEmail,
    connectedAt: account.connectedAt,
    lastSyncedAt: account.lastSyncedAt,
    lastSyncCount: account.lastSyncCount,
    status: account.status,
  };
}

export type UpsertCalendarAccountInput = {
  userId: string;
  provider: CalendarProviderId;
  accountEmail: string;
  accessToken: string;
  refreshToken?: string | null;
  tokenExpiresAt?: string | null;
  scopes?: string[];
  metadata?: Record<string, unknown>;
};

export const calendarAccountRepository = {
  async listByUser(userId: string): Promise<CalendarAccountRecord[]> {
    const db = getSupabaseAdmin();
    if (!db) return [];

    const uid = normalizeSubscriptionUserId(userId);
    const { data, error } = await db
      .from(TABLE)
      .select("*")
      .eq("user_id", uid)
      .eq("status", "connected")
      .order("connected_at", { ascending: false });

    if (error) {
      console.error("[calendar/repository] listByUser", error);
      return [];
    }

    return (data as CalendarAccountRow[] | null)?.map(mapRow) ?? [];
  },

  async getPrimary(
    userId: string,
    provider: CalendarProviderId = "google"
  ): Promise<CalendarAccountRecord | null> {
    const accounts = await this.listByUser(userId);
    return accounts.find((a) => a.provider === provider) ?? accounts[0] ?? null;
  },

  async upsert(input: UpsertCalendarAccountInput): Promise<CalendarAccountRecord> {
    const db = getSupabaseAdmin();
    if (!db) {
      throw new Error("Database not configured.");
    }

    const uid = normalizeSubscriptionUserId(input.userId);
    const email = input.accountEmail.trim().toLowerCase();

    const payload = {
      user_id: uid,
      provider: input.provider,
      account_email: email,
      access_token: input.accessToken,
      refresh_token: input.refreshToken ?? null,
      token_expires_at: input.tokenExpiresAt ?? null,
      scopes: input.scopes ?? [],
      status: "connected",
      metadata: input.metadata ?? {},
      connected_at: new Date().toISOString(),
    };

    const { data, error } = await db
      .from(TABLE)
      .upsert(payload, { onConflict: "user_id,provider,account_email" })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to save calendar account.");
    }

    return mapRow(data as CalendarAccountRow);
  },

  async updateTokens(
    userId: string,
    provider: CalendarProviderId,
    accountEmail: string,
    tokens: {
      accessToken: string;
      refreshToken?: string | null;
      tokenExpiresAt?: string | null;
    }
  ): Promise<void> {
    const db = getSupabaseAdmin();
    if (!db) return;

    await db
      .from(TABLE)
      .update({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken ?? null,
        token_expires_at: tokens.tokenExpiresAt ?? null,
      })
      .eq("user_id", normalizeSubscriptionUserId(userId))
      .eq("provider", provider)
      .eq("account_email", accountEmail.trim().toLowerCase());
  },

  async markSynced(
    userId: string,
    provider: CalendarProviderId,
    accountEmail: string,
    count: number
  ): Promise<void> {
    const db = getSupabaseAdmin();
    if (!db) return;

    await db
      .from(TABLE)
      .update({
        last_synced_at: new Date().toISOString(),
        last_sync_count: count,
        status: "connected",
      })
      .eq("user_id", normalizeSubscriptionUserId(userId))
      .eq("provider", provider)
      .eq("account_email", accountEmail.trim().toLowerCase());
  },

  async disconnect(
    userId: string,
    provider: CalendarProviderId = "google",
    accountEmail?: string
  ): Promise<void> {
    const db = getSupabaseAdmin();
    if (!db) return;

    let query = db
      .from(TABLE)
      .delete()
      .eq("user_id", normalizeSubscriptionUserId(userId))
      .eq("provider", provider);

    if (accountEmail) {
      query = query.eq("account_email", accountEmail.trim().toLowerCase());
    }

    await query;
  },
};
