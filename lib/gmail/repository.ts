import {
  getSupabaseAdmin,
  isMissingGmailSchemaError,
  isSupabaseNetworkError,
  requireSupabaseAdmin,
} from "@/lib/supabase-admin";
import { logApiError } from "@/lib/api/log-error";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isUniqueViolation(error: { message?: string; code?: string }): boolean {
  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "23505" ||
    message.includes("duplicate key") ||
    message.includes("unique constraint") ||
    message.includes("gmail_accounts_user_email_key")
  );
}

export class GmailAccountRepository {
  private client() {
    if (process.env.NODE_ENV === "production") {
      return requireSupabaseAdmin();
    }
    return getSupabaseAdmin();
  }

  private handleDbError(
    operation: string,
    error: { message: string; code?: string; details?: string; hint?: string },
    context?: Record<string, unknown>
  ): never {
    logApiError("gmail/repository", error, { operation, ...context });

    if (isMissingGmailSchemaError(error.message)) {
      throw new Error(
        "Gmail account tables not found. Run supabase/migrations/002_gmail_accounts.sql in the Supabase SQL Editor."
      );
    }
    if (isSupabaseNetworkError(error.message)) {
      throw new Error(
        `Could not reach Supabase during ${operation}: ${error.message}`
      );
    }
    throw new Error(
      `${operation} failed: ${error.message}` +
        (error.code ? ` (${error.code})` : "") +
        (error.details ? ` — ${error.details}` : "")
    );
  }

  private normalizeUserId(userId: string): string {
    return normalizeSubscriptionUserId(userId);
  }

  async listAccounts(userId: string): Promise<GmailAccountRecord[]> {
    const normalizedUserId = this.normalizeUserId(userId);
    const db = this.client();
    if (!db) {
      return memoryGmailAccountStore.listAccounts(normalizedUserId);
    }

    console.log("[gmail/repository] listAccounts", { user_id: normalizedUserId });

    const { data, error } = await db
      .from("gmail_accounts")
      .select("*")
      .eq("user_id", normalizedUserId)
      .order("connected_at", { ascending: false });

    if (error) {
      if (isMissingGmailSchemaError(error.message)) {
        return memoryGmailAccountStore.listAccounts(normalizedUserId);
      }
      this.handleDbError("listAccounts", error, { user_id: normalizedUserId });
    }

    return (data as GmailAccountRow[]).map(mapRow);
  }

  async getAccount(
    userId: string,
    email: string
  ): Promise<GmailAccountRecord | null> {
    const normalizedUserId = this.normalizeUserId(userId);
    const normalizedEmail = normalizeEmail(email);
    const db = this.client();
    if (!db) {
      return memoryGmailAccountStore.getAccount(normalizedUserId, normalizedEmail);
    }

    const { data, error } = await db
      .from("gmail_accounts")
      .select("*")
      .eq("user_id", normalizedUserId)
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      if (isMissingGmailSchemaError(error.message)) {
        return memoryGmailAccountStore.getAccount(
          normalizedUserId,
          normalizedEmail
        );
      }
      this.handleDbError("getAccount", error, {
        user_id: normalizedUserId,
        email: normalizedEmail,
      });
    }

    return data ? mapRow(data as GmailAccountRow) : null;
  }

  async getPrimaryAccount(userId: string): Promise<GmailAccountRecord | null> {
    const accounts = await this.listAccounts(userId);
    return accounts[0] ?? null;
  }

  async countAccounts(userId: string): Promise<number> {
    const normalizedUserId = this.normalizeUserId(userId);
    const db = this.client();
    if (!db) {
      return memoryGmailAccountStore.countAccounts(normalizedUserId);
    }

    const { count, error } = await db
      .from("gmail_accounts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", normalizedUserId);

    if (error) {
      if (isMissingGmailSchemaError(error.message)) {
        return memoryGmailAccountStore.countAccounts(normalizedUserId);
      }
      this.handleDbError("countAccounts", error, { user_id: normalizedUserId });
    }

    return count ?? 0;
  }

  async upsertAccount(
    userId: string,
    input: UpsertGmailAccountInput
  ): Promise<{ account: GmailAccountRecord; isNew: boolean }> {
    const normalizedUserId = this.normalizeUserId(userId);
    const normalizedEmail = normalizeEmail(input.email);
    const db = this.client();
    if (!db) {
      return memoryGmailAccountStore.upsertAccount(normalizedUserId, {
        ...input,
        email: normalizedEmail,
      });
    }

    const existing = await this.getAccount(normalizedUserId, normalizedEmail);

    console.log("[gmail/repository] upsertAccount", {
      user_id: normalizedUserId,
      email: normalizedEmail,
      exists: Boolean(existing),
      hasRefreshToken: Boolean(input.refreshToken),
    });

    if (existing) {
      const { data, error, status, statusText } = await db
        .from("gmail_accounts")
        .update({
          access_token: input.accessToken,
          refresh_token: input.refreshToken ?? existing.refreshToken,
          token_expires_at: input.tokenExpiresAt ?? existing.tokenExpiresAt,
        })
        .eq("id", existing.id)
        .select("*");

      console.log("[gmail/repository] update response", {
        httpStatus: status,
        statusText,
        error,
        rows: Array.isArray(data) ? data.length : 0,
      });

      if (error) {
        this.handleDbError("updateAccount", error, {
          user_id: normalizedUserId,
          email: normalizedEmail,
          account_id: existing.id,
        });
      }

      const row = Array.isArray(data)
        ? (data[0] as GmailAccountRow | undefined)
        : (data as GmailAccountRow | null);

      if (!row) {
        throw new Error(
          `updateAccount returned no row for ${normalizedEmail}`
        );
      }

      return { account: mapRow(row), isNew: false };
    }

    const insertPayload = {
      user_id: normalizedUserId,
      email: normalizedEmail,
      access_token: input.accessToken,
      refresh_token: input.refreshToken ?? null,
      token_expires_at: input.tokenExpiresAt ?? null,
    };

    console.log("[gmail/repository] insert request", {
      user_id: insertPayload.user_id,
      email: insertPayload.email,
      has_access_token: Boolean(insertPayload.access_token),
      has_refresh_token: Boolean(insertPayload.refresh_token),
      token_expires_at: insertPayload.token_expires_at,
    });

    const { data, error, status, statusText } = await db
      .from("gmail_accounts")
      .insert(insertPayload)
      .select("*");

    console.log("[gmail/repository] insert response", {
      httpStatus: status,
      statusText,
      error,
      rows: Array.isArray(data) ? data.length : 0,
      data,
    });

    if (error) {
      // Race: another request inserted the same (user_id, email) — update instead.
      if (isUniqueViolation(error)) {
        console.warn("[gmail/repository] unique violation — updating existing", {
          user_id: normalizedUserId,
          email: normalizedEmail,
        });
        const raced = await this.getAccount(normalizedUserId, normalizedEmail);
        if (raced) {
          const { data: updated, error: updateError } = await db
            .from("gmail_accounts")
            .update({
              access_token: input.accessToken,
              refresh_token: input.refreshToken ?? raced.refreshToken,
              token_expires_at: input.tokenExpiresAt ?? raced.tokenExpiresAt,
            })
            .eq("id", raced.id)
            .select("*");

          if (updateError) {
            this.handleDbError("updateAccountAfterRace", updateError, {
              user_id: normalizedUserId,
              email: normalizedEmail,
            });
          }

          const racedRow = Array.isArray(updated)
            ? (updated[0] as GmailAccountRow | undefined)
            : (updated as GmailAccountRow | null);

          if (racedRow) {
            return { account: mapRow(racedRow), isNew: false };
          }

          return { account: raced, isNew: false };
        }
      }

      if (isMissingGmailSchemaError(error.message)) {
        return memoryGmailAccountStore.upsertAccount(normalizedUserId, {
          ...input,
          email: normalizedEmail,
        });
      }

      this.handleDbError("insertAccount", error, {
        user_id: normalizedUserId,
        email: normalizedEmail,
      });
    }

    const row = Array.isArray(data)
      ? (data[0] as GmailAccountRow | undefined)
      : (data as GmailAccountRow | null);

    if (!row) {
      // Insert may have succeeded without returning a row — read back.
      const readBack = await this.getAccount(normalizedUserId, normalizedEmail);
      if (readBack) {
        return { account: readBack, isNew: true };
      }
      throw new Error(
        `insertAccount returned no row for ${normalizedEmail} after insert`
      );
    }

    console.log("[gmail/repository] insert success", {
      id: row.id,
      user_id: row.user_id,
      email: row.email,
    });

    return { account: mapRow(row), isNew: true };
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
    const normalizedUserId = this.normalizeUserId(userId);
    const normalizedEmail = normalizeEmail(email);
    const db = this.client();
    if (!db) {
      return memoryGmailAccountStore.updateTokens(
        normalizedUserId,
        normalizedEmail,
        tokens
      );
    }

    const { data, error } = await db
      .from("gmail_accounts")
      .update({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_expires_at: tokens.tokenExpiresAt,
      })
      .eq("user_id", normalizedUserId)
      .eq("email", normalizedEmail)
      .select("*")
      .maybeSingle();

    if (error) {
      if (isMissingGmailSchemaError(error.message)) {
        return memoryGmailAccountStore.updateTokens(
          normalizedUserId,
          normalizedEmail,
          tokens
        );
      }
      this.handleDbError("updateTokens", error, {
        user_id: normalizedUserId,
        email: normalizedEmail,
      });
    }

    return data ? mapRow(data as GmailAccountRow) : null;
  }

  async updateSyncStatus(
    userId: string,
    email: string,
    syncCount: number
  ): Promise<GmailAccountRecord | null> {
    const normalizedUserId = this.normalizeUserId(userId);
    const normalizedEmail = normalizeEmail(email);
    const db = this.client();
    const now = new Date().toISOString();

    if (!db) {
      return memoryGmailAccountStore.updateSyncStatus(
        normalizedUserId,
        normalizedEmail,
        syncCount
      );
    }

    const { data, error } = await db
      .from("gmail_accounts")
      .update({
        last_synced_at: now,
        last_sync_count: syncCount,
      })
      .eq("user_id", normalizedUserId)
      .eq("email", normalizedEmail)
      .select("*")
      .maybeSingle();

    if (error) {
      if (isMissingGmailSchemaError(error.message)) {
        return memoryGmailAccountStore.updateSyncStatus(
          normalizedUserId,
          normalizedEmail,
          syncCount
        );
      }
      this.handleDbError("updateSyncStatus", error, {
        user_id: normalizedUserId,
        email: normalizedEmail,
      });
    }

    return data ? mapRow(data as GmailAccountRow) : null;
  }

  async deleteAccount(userId: string, email: string): Promise<boolean> {
    const normalizedUserId = this.normalizeUserId(userId);
    const normalizedEmail = normalizeEmail(email);
    const db = this.client();
    if (!db) {
      return memoryGmailAccountStore.deleteAccount(
        normalizedUserId,
        normalizedEmail
      );
    }

    const { error, count } = await db
      .from("gmail_accounts")
      .delete({ count: "exact" })
      .eq("user_id", normalizedUserId)
      .eq("email", normalizedEmail);

    if (error) {
      if (isMissingGmailSchemaError(error.message)) {
        return memoryGmailAccountStore.deleteAccount(
          normalizedUserId,
          normalizedEmail
        );
      }
      this.handleDbError("deleteAccount", error, {
        user_id: normalizedUserId,
        email: normalizedEmail,
      });
    }

    return (count ?? 0) > 0;
  }
}

export const gmailAccountRepository = new GmailAccountRepository();
