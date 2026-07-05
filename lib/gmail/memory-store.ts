import { randomUUID } from "crypto";
import type {
  GmailAccountRecord,
  UpsertGmailAccountInput,
} from "./types";

class MemoryGmailAccountStore {
  private accounts = new Map<string, GmailAccountRecord[]>();

  async listAccounts(userId: string): Promise<GmailAccountRecord[]> {
    return [...(this.accounts.get(userId) ?? [])].sort(
      (a, b) =>
        new Date(b.connectedAt).getTime() - new Date(a.connectedAt).getTime()
    );
  }

  async getAccount(
    userId: string,
    email: string
  ): Promise<GmailAccountRecord | null> {
    return (
      (this.accounts.get(userId) ?? []).find((a) => a.email === email) ?? null
    );
  }

  async countAccounts(userId: string): Promise<number> {
    return (this.accounts.get(userId) ?? []).length;
  }

  async upsertAccount(
    userId: string,
    input: UpsertGmailAccountInput
  ): Promise<{ account: GmailAccountRecord; isNew: boolean }> {
    const list = this.accounts.get(userId) ?? [];
    const existing = list.find((a) => a.email === input.email);
    const now = new Date().toISOString();

    if (existing) {
      const updated: GmailAccountRecord = {
        ...existing,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken ?? existing.refreshToken,
        tokenExpiresAt: input.tokenExpiresAt ?? existing.tokenExpiresAt,
      };
      this.accounts.set(
        userId,
        list.map((a) => (a.id === existing.id ? updated : a))
      );
      return { account: updated, isNew: false };
    }

    const created: GmailAccountRecord = {
      id: randomUUID(),
      userId,
      email: input.email,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken ?? null,
      tokenExpiresAt: input.tokenExpiresAt ?? null,
      connectedAt: now,
      lastSyncedAt: null,
      lastSyncCount: 0,
    };

    this.accounts.set(userId, [...list, created]);
    return { account: created, isNew: true };
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
    const list = this.accounts.get(userId) ?? [];
    const index = list.findIndex((a) => a.email === email);
    if (index === -1) return null;

    const updated: GmailAccountRecord = {
      ...list[index],
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? list[index].refreshToken,
      tokenExpiresAt: tokens.tokenExpiresAt ?? list[index].tokenExpiresAt,
    };

    const next = [...list];
    next[index] = updated;
    this.accounts.set(userId, next);
    return updated;
  }

  async updateSyncStatus(
    userId: string,
    email: string,
    syncCount: number
  ): Promise<GmailAccountRecord | null> {
    const list = this.accounts.get(userId) ?? [];
    const index = list.findIndex((a) => a.email === email);
    if (index === -1) return null;

    const updated: GmailAccountRecord = {
      ...list[index],
      lastSyncedAt: new Date().toISOString(),
      lastSyncCount: syncCount,
    };

    const next = [...list];
    next[index] = updated;
    this.accounts.set(userId, next);
    return updated;
  }
}

export const memoryGmailAccountStore = new MemoryGmailAccountStore();
