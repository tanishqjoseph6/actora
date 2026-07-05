export type GmailAccountRecord = {
  id: string;
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: string | null;
  connectedAt: string;
  lastSyncedAt: string | null;
  lastSyncCount: number;
};

export type GmailAccountPublic = {
  id: string;
  email: string;
  connectedAt: string;
  lastSyncedAt: string | null;
  lastSyncCount: number;
};

export type UpsertGmailAccountInput = {
  email: string;
  accessToken: string;
  refreshToken?: string | null;
  tokenExpiresAt?: string | null;
};

export function toPublicGmailAccount(
  account: GmailAccountRecord
): GmailAccountPublic {
  return {
    id: account.id,
    email: account.email,
    connectedAt: account.connectedAt,
    lastSyncedAt: account.lastSyncedAt,
    lastSyncCount: account.lastSyncCount,
  };
}
