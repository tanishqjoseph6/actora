import {
  getSupabaseAdmin,
  isMissingGmailSchemaError,
  isSupabaseNetworkError,
  requireSupabaseAdmin,
} from "@/lib/supabase-admin";
import {
  formatPostgrestError,
  logDbWriteResult,
  logDbWriteStart,
  throwDbWriteError,
} from "@/lib/supabase/db-log";
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

const TABLE = "gmail_accounts";
const SCOPE = "gmail/repository";

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

function shouldUseMemoryFallback(): boolean {
  return process.env.NODE_ENV !== "production";
}

export class GmailAccountRepository {
  private clientForRead() {
    if (process.env.NODE_ENV === "production") {
      return requireSupabaseAdmin();
    }
    return getSupabaseAdmin();
  }

  private clientForWrite() {
    if (process.env.NODE_ENV === "production") {
      return requireSupabaseAdmin();
    }
    const db = getSupabaseAdmin();
    if (db) return db;
    if (shouldUseMemoryFallback()) return null;
    return requireSupabaseAdmin();
  }

  private handleDbError(
    operation: string,
    error: { message: string; code?: string; details?: string; hint?: string },
    context?: Record<string, unknown>
  ): never {
    if (isMissingGmailSchemaError(error.message)) {
      throw new Error(
        `gmail_accounts schema missing — run supabase/migrations/002_gmail_accounts.sql: ${formatPostgrestError(error)}`
      );
    }
    if (isSupabaseNetworkError(error.message)) {
      throw new Error(
        `Supabase network error during ${operation}: ${error.message}`
      );
    }
    throwDbWriteError(SCOPE, operation, TABLE, error, context);
  }

  private normalizeUserId(userId: string): string {
    return normalizeSubscriptionUserId(userId);
  }

  async listAccounts(userId: string): Promise<GmailAccountRecord[]> {
    const normalizedUserId = this.normalizeUserId(userId);
    const db = this.clientForRead();

    if (!db) {
      if (!shouldUseMemoryFallback()) {
        throw new Error("Supabase admin client unavailable for listAccounts");
      }
      return memoryGmailAccountStore.listAccounts(normalizedUserId);
    }

    const { data, error, status, statusText } = await db
      .from(TABLE)
      .select("*")
      .eq("user_id", normalizedUserId)
      .order("connected_at", { ascending: false });

    if (error) {
      this.handleDbError("listAccounts", error, { user_id: normalizedUserId });
    }

    logDbWriteResult(SCOPE, "listAccounts", TABLE, {
      httpStatus: status,
      statusText,
      rows: data?.length ?? 0,
    });

    return (data as GmailAccountRow[]).map(mapRow);
  }

  async getAccount(
    userId: string,
    email: string
  ): Promise<GmailAccountRecord | null> {
    const normalizedUserId = this.normalizeUserId(userId);
    const normalizedEmail = normalizeEmail(email);
    const db = this.clientForRead();

    if (!db) {
      if (!shouldUseMemoryFallback()) {
        throw new Error("Supabase admin client unavailable for getAccount");
      }
      return memoryGmailAccountStore.getAccount(
        normalizedUserId,
        normalizedEmail
      );
    }

    const { data, error } = await db
      .from(TABLE)
      .select("*")
      .eq("user_id", normalizedUserId)
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error) {
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
    const db = this.clientForRead();

    if (!db) {
      if (!shouldUseMemoryFallback()) {
        throw new Error("Supabase admin client unavailable for countAccounts");
      }
      return memoryGmailAccountStore.countAccounts(normalizedUserId);
    }

    const { count, error } = await db
      .from(TABLE)
      .select("*", { count: "exact", head: true })
      .eq("user_id", normalizedUserId);

    if (error) {
      this.handleDbError("countAccounts", error, { user_id: normalizedUserId });
    }

    return count ?? 0;
  }

  /**
   * Insert or update gmail_accounts. Duplicate (user_id, email) updates tokens in place.
   */
  async upsertAccount(
    userId: string,
    input: UpsertGmailAccountInput
  ): Promise<{ account: GmailAccountRecord; isNew: boolean }> {
    const normalizedUserId = this.normalizeUserId(userId);
    const normalizedEmail = normalizeEmail(input.email);
    const db = this.clientForWrite();

    if (!db) {
      return memoryGmailAccountStore.upsertAccount(normalizedUserId, {
        ...input,
        email: normalizedEmail,
      });
    }

    const existing = await this.getAccount(normalizedUserId, normalizedEmail);

    logDbWriteStart(SCOPE, "upsertAccount", TABLE, {
      user_id: normalizedUserId,
      email: normalizedEmail,
      exists: Boolean(existing),
      hasRefreshToken: Boolean(input.refreshToken),
    });

    if (existing) {
      const updatePayload = {
        access_token: input.accessToken,
        refresh_token: input.refreshToken ?? existing.refreshToken,
        token_expires_at: input.tokenExpiresAt ?? existing.tokenExpiresAt,
      };

      logDbWriteStart(SCOPE, "update", TABLE, {
        account_id: existing.id,
        user_id: normalizedUserId,
        email: normalizedEmail,
      });

      const { data, error, status, statusText } = await db
        .from(TABLE)
        .update(updatePayload)
        .eq("id", existing.id)
        .select("*");

      logDbWriteResult(SCOPE, "update", TABLE, {
        httpStatus: status,
        statusText,
        error,
        rows: Array.isArray(data) ? data.length : 0,
        data,
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
          `updateAccount returned no row for ${normalizedEmail} (account_id=${existing.id})`
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

    logDbWriteStart(SCOPE, "insert", TABLE, {
      user_id: insertPayload.user_id,
      email: insertPayload.email,
      has_access_token: Boolean(insertPayload.access_token),
      has_refresh_token: Boolean(insertPayload.refresh_token),
    });

    const { data, error, status, statusText } = await db
      .from(TABLE)
      .insert(insertPayload)
      .select("*");

    logDbWriteResult(SCOPE, "insert", TABLE, {
      httpStatus: status,
      statusText,
      error,
      rows: Array.isArray(data) ? data.length : 0,
      data,
    });

    if (error) {
      if (isUniqueViolation(error)) {
        console.warn(`[${SCOPE}] duplicate insert — updating existing row`, {
          user_id: normalizedUserId,
          email: normalizedEmail,
        });
        const raced = await this.getAccount(normalizedUserId, normalizedEmail);
        if (raced) {
          const { data: updated, error: updateError, status, statusText } =
            await db
              .from(TABLE)
              .update({
                access_token: input.accessToken,
                refresh_token: input.refreshToken ?? raced.refreshToken,
                token_expires_at: input.tokenExpiresAt ?? raced.tokenExpiresAt,
              })
              .eq("id", raced.id)
              .select("*");

          logDbWriteResult(SCOPE, "updateAfterDuplicate", TABLE, {
            httpStatus: status,
            statusText,
            error: updateError,
            rows: Array.isArray(updated) ? updated.length : 0,
            data: updated,
          });

          if (updateError) {
            this.handleDbError("updateAfterDuplicate", updateError, {
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

      this.handleDbError("insertAccount", error, {
        user_id: normalizedUserId,
        email: normalizedEmail,
      });
    }

    let row = Array.isArray(data)
      ? (data[0] as GmailAccountRow | undefined)
      : (data as GmailAccountRow | null);

    if (!row) {
      const readBack = await this.getAccount(normalizedUserId, normalizedEmail);
      if (!readBack) {
        throw new Error(
          `insertAccount succeeded but row not readable for ${normalizedEmail}`
        );
      }
      row = {
        id: readBack.id,
        user_id: readBack.userId,
        email: readBack.email,
        access_token: readBack.accessToken,
        refresh_token: readBack.refreshToken,
        token_expires_at: readBack.tokenExpiresAt,
        connected_at: readBack.connectedAt,
        last_synced_at: readBack.lastSyncedAt,
        last_sync_count: readBack.lastSyncCount,
      };
    }

    console.log(`[${SCOPE}] insert verified`, {
      id: row.id,
      user_id: row.user_id,
      email: row.email,
    });

    return { account: mapRow(row), isNew: true };
  }

  /** Confirm a row exists in Supabase after upsert (production safety check). */
  async verifyPersisted(
    userId: string,
    email: string,
    expectedId?: string
  ): Promise<GmailAccountRecord> {
    const saved = await this.getAccount(userId, email);
    if (!saved) {
      throw new Error(
        `gmail_accounts verify failed: no row for user_id=${normalizeSubscriptionUserId(userId)} email=${normalizeEmail(email)}`
      );
    }
    if (expectedId && saved.id !== expectedId) {
      throw new Error(
        `gmail_accounts verify failed: id mismatch expected=${expectedId} actual=${saved.id}`
      );
    }
    return saved;
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
    const db = this.clientForWrite();

    if (!db) {
      if (!shouldUseMemoryFallback()) {
        throw new Error("Supabase admin client unavailable for updateTokens");
      }
      return memoryGmailAccountStore.updateTokens(
        normalizedUserId,
        normalizedEmail,
        tokens
      );
    }

    logDbWriteStart(SCOPE, "updateTokens", TABLE, {
      user_id: normalizedUserId,
      email: normalizedEmail,
    });

    const { data, error, status, statusText } = await db
      .from(TABLE)
      .update({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_expires_at: tokens.tokenExpiresAt,
      })
      .eq("user_id", normalizedUserId)
      .eq("email", normalizedEmail)
      .select("*")
      .maybeSingle();

    logDbWriteResult(SCOPE, "updateTokens", TABLE, {
      httpStatus: status,
      statusText,
      error,
      rows: data ? 1 : 0,
      data,
    });

    if (error) {
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
    const db = this.clientForWrite();
    const now = new Date().toISOString();

    if (!db) {
      if (!shouldUseMemoryFallback()) {
        throw new Error("Supabase admin client unavailable for updateSyncStatus");
      }
      return memoryGmailAccountStore.updateSyncStatus(
        normalizedUserId,
        normalizedEmail,
        syncCount
      );
    }

    logDbWriteStart(SCOPE, "updateSyncStatus", TABLE, {
      user_id: normalizedUserId,
      email: normalizedEmail,
      syncCount,
    });

    const { data, error, status, statusText } = await db
      .from(TABLE)
      .update({
        last_synced_at: now,
        last_sync_count: syncCount,
      })
      .eq("user_id", normalizedUserId)
      .eq("email", normalizedEmail)
      .select("*")
      .maybeSingle();

    logDbWriteResult(SCOPE, "updateSyncStatus", TABLE, {
      httpStatus: status,
      statusText,
      error,
      rows: data ? 1 : 0,
      data,
    });

    if (error) {
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
    const db = this.clientForWrite();

    if (!db) {
      if (!shouldUseMemoryFallback()) {
        throw new Error("Supabase admin client unavailable for deleteAccount");
      }
      return memoryGmailAccountStore.deleteAccount(
        normalizedUserId,
        normalizedEmail
      );
    }

    logDbWriteStart(SCOPE, "delete", TABLE, {
      user_id: normalizedUserId,
      email: normalizedEmail,
    });

    const { error, count, status, statusText } = await db
      .from(TABLE)
      .delete({ count: "exact" })
      .eq("user_id", normalizedUserId)
      .eq("email", normalizedEmail);

    logDbWriteResult(SCOPE, "delete", TABLE, {
      httpStatus: status,
      statusText,
      error,
      rows: count ?? 0,
    });

    if (error) {
      this.handleDbError("deleteAccount", error, {
        user_id: normalizedUserId,
        email: normalizedEmail,
      });
    }

    return (count ?? 0) > 0;
  }
}

export const gmailAccountRepository = new GmailAccountRepository();
