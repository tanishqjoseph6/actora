import {
  applyOAuthCredentials,
  createOAuth2Client,
  isTokenExpired,
  refreshOAuthTokens,
} from "@/lib/gmail/oauth";
import { gmailAccountRepository } from "@/lib/gmail/repository";
import { calendarAccountRepository } from "@/lib/calendar/repository";
import type { google } from "googleapis";
import type { CalendarAccountRecord } from "@/lib/calendar/types";

type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;

/** Build a Gmail OAuth client from stored account tokens (no HTTP request). */
export async function getGmailClientForUser(
  userId: string
): Promise<OAuth2Client | null> {
  const account = await gmailAccountRepository.getPrimaryAccount(userId);
  if (!account?.accessToken) return null;

  let accessToken = account.accessToken;
  let refreshToken = account.refreshToken;

  if (isTokenExpired(account.tokenExpiresAt) && refreshToken) {
    try {
      const refreshed = await refreshOAuthTokens(refreshToken);
      accessToken = refreshed.accessToken;
      refreshToken = refreshed.refreshToken;
      await gmailAccountRepository.updateTokens(userId, account.email, {
        accessToken,
        refreshToken,
        tokenExpiresAt: refreshed.expiresAt,
      });
    } catch {
      return null;
    }
  }

  const client = createOAuth2Client();
  applyOAuthCredentials(client, { accessToken, refreshToken });
  return client;
}

export async function getCalendarAuthForUser(
  userId: string
): Promise<{
  oauth2Client: OAuth2Client;
  account: CalendarAccountRecord;
} | null> {
  let account = await calendarAccountRepository.getPrimary(userId, "google");
  if (!account) return null;

  let accessToken = account.accessToken;
  let refreshToken = account.refreshToken;

  if (isTokenExpired(account.tokenExpiresAt) && refreshToken) {
    try {
      const refreshed = await refreshOAuthTokens(refreshToken);
      accessToken = refreshed.accessToken;
      refreshToken = refreshed.refreshToken;
      await calendarAccountRepository.updateTokens(
        userId,
        account.provider,
        account.accountEmail,
        {
          accessToken,
          refreshToken,
          tokenExpiresAt: refreshed.expiresAt,
        }
      );
      account = {
        ...account,
        accessToken,
        refreshToken,
        tokenExpiresAt: refreshed.expiresAt,
      };
    } catch {
      return null;
    }
  }

  const oauth2Client = applyOAuthCredentials(createOAuth2Client(), {
    accessToken,
    refreshToken,
  });

  return { oauth2Client, account };
}
