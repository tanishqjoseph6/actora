import { getSupabaseAdmin, isMissingGmailSchemaError } from "@/lib/supabase-admin";
import { memoryGmailAccountStore } from "./memory-store";
import type {
  GmailAccountRecord,
  UpsertGmailAccountInput,
} from "./types";

type GmailAccountRow = {
  id: string;
  user_id: string;
  email: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  connected_at: string;
  last_synced_at: string | null;
  last_sync_count: number;
};

function mapRow(row: GmailAccountRow): GmailAccountRecord {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    tokenExpiresAt: row.token_expires_at,
    connectedAt: row.connected_at,
    lastSyncedAt: row.last_synced_at,
    lastSyncCount: row.last_sync_count,
  };
}

export class GmailAccountRepository {
  private client() {
    return getSupabaseAdmin();
  }

  private handleDbError(error: { message: string }): never {
    if (isMissingGmailSchemaError(error.message)) {
      throw new Error(
        "Gmail account tables not found. Run supabase/migrations/002_gmail_accounts.sql in the Supabase SQL Editor."
      );
    }
    throw new Error(error.message);
  }

  async listAccounts(userId: string): Promise<GmailAccountRecord[]> {
    const db = this.client();
    if (!db) {
      return memoryGmailAccountStore.listAccounts(userId);
    }

    const { data, error } = await db
      .from("gmail_accounts")
      .select("*")
      .eq("user_id", userId)
      .order("connected_at", { ascending: false });

    if (error) {
      if (isMissingGmailSchemaError(error.message)) {
        return memoryGmailAccountStore.listAccounts(userId);
      }
      this.handleDbError(error);
    }

    return (data as GmailAccountRow[]).map(mapRow);
  }

  async getAccount(
    userId: string,
    email: string
  ): Promise<GmailAccountRecord | null> {
    const db = this.client();
    if (!db) {
      return memoryGmailAccountStore.getAccount(userId, email);
    }

    const { data, error } = await db
      .from("gmail_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("email", email)
      .maybeSingle();

    if (error) {
      if (isMissingGmailSchemaError(error.message)) {
        return memoryGmailAccountStore.getAccount(userId, email);
      }
      this.handleDbError(error);
    }

    return data ? mapRow(data as GmailAccountRow) : null;
  }

  async getPrimaryAccount(userId: string): Promise<GmailAccountRecord | null> {
    const accounts = await this.listAccounts(userId);
    return accounts[0] ?? null;
  }

  async countAccounts(userId: string): Promise<number> {
    const db = this.client();
    if (!db) {
      return memoryGmailAccountStore.countAccounts(userId);
    }

    const { count, error } = await db
      .from("gmail_accounts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      if (isMissingGmailSchemaError(error.message)) {
        return memoryGmailAccountStore.countAccounts(userId);
      }
      this.handleDbError(error);
    }

    return count ?? 0;
  }

  async upsertAccount(
    userId: string,
    input: UpsertGmailAccountInput
  ): Promise<{ account: GmailAccountRecord; isNew: boolean }> {
    const db = this.client();
    if (!db) {
      return memoryGmailAccountStore.upsertAccount(userId, input);
    }

    const existing = await this.getAccount(userId, input.email);

    if (existing) {
      const { data, error } = await db
        .from("gmail_accounts")
        .update({
          access_token: input.accessToken,
          refresh_token: input.refreshToken ?? existing.refreshToken,
          token_expires_at: input.tokenExpiresAt ?? existing.tokenExpiresAt,
        })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) this.handleDbError(error);
      return { account: mapRow(data as GmailAccountRow), isNew: false };
    }

    const { data, error } = await db
      .from("gmail_accounts")
      .insert({
        user_id: userId,
        email: input.email,
        access_token: input.accessToken,
        refresh_token: input.refreshToken ?? null,
        token_expires_at: input.tokenExpiresAt ?? null,
      })
      .select("*")
      .single();

    if (error) {
      if (isMissingGmailSchemaError(error.message)) {
        return memoryGmailAccountStore.upsertAccount(userId, input);
      }
      this.handleDbError(error);
    }

    return { account: mapRow(data as GmailAccountRow), isNew: true };
  }

  async updateTokens(
    userId: string,
    email: string,
    tokens: {
      accessToken: string;
      refreshToken?: string | null;
      tokenExpiresAt?: string | null;
    }
  ): Promise<GmailAccountRecord | null> {
    const db = this.client();
    if (!db) {
      return memoryGmailAccountStore.updateTokens(userId, email, tokens);
    }

    const { data, error } = await db
      .from("gmail_accounts")
      .update({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_expires_at: tokens.tokenExpiresAt,
      })
      .eq("user_id", userId)
      .eq("email", email)
      .select("*")
      .maybeSingle();

    if (error) {
      if (isMissingGmailSchemaError(error.message)) {
        return memoryGmailAccountStore.updateTokens(userId, email, tokens);
      }
      this.handleDbError(error);
    }

    return data ? mapRow(data as GmailAccountRow) : null;
  }

  async updateSyncStatus(
    userId: string,
    email: string,
    syncCount: number
  ): Promise<GmailAccountRecord | null> {
    const db = this.client();
    const now = new Date().toISOString();

    if (!db) {
      return memoryGmailAccountStore.updateSyncStatus(userId, email, syncCount);
    }

    const { data, error } = await db
      .from("gmail_accounts")
      .update({
        last_synced_at: now,
        last_sync_count: syncCount,
      })
      .eq("user_id", userId)
      .eq("email", email)
      .select("*")
      .maybeSingle();

    if (error) {
      if (isMissingGmailSchemaError(error.message)) {
        return memoryGmailAccountStore.updateSyncStatus(
          userId,
          email,
          syncCount
        );
      }
      this.handleDbError(error);
    }

    return data ? mapRow(data as GmailAccountRow) : null;
  }

  async deleteAccount(userId: string, email: string): Promise<boolean> {
    const db = this.client();
    if (!db) {
      return memoryGmailAccountStore.deleteAccount(userId, email);
    }

    const { error, count } = await db
      .from("gmail_accounts")
      .delete({ count: "exact" })
      .eq("user_id", userId)
      .eq("email", email);

    if (error) {
      if (isMissingGmailSchemaError(error.message)) {
        return memoryGmailAccountStore.deleteAccount(userId, email);
      }
      this.handleDbError(error);
    }

    return (count ?? 0) > 0;
  }
}

export const gmailAccountRepository = new GmailAccountRepository();
