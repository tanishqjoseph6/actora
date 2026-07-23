import "server-only";

import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { shouldUseSecureCookies } from "@/lib/auth/nextauth-url";
import {
  applyOAuthCredentials,
  createOAuth2Client,
  getGmailProfileEmail,
  isTokenExpired,
  refreshOAuthTokens,
} from "@/lib/gmail/oauth";
import { gmailAccountRepository } from "@/lib/gmail/repository";
import { calendarAccountRepository } from "@/lib/calendar/repository";
import { GOOGLE_CALENDAR_SCOPES } from "@/lib/calendar/scopes";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import type { CalendarAccountRecord } from "@/lib/calendar/types";

export type CalendarAuthResult =
  | {
      ok: true;
      oauth2Client: InstanceType<typeof google.auth.OAuth2>;
      account: CalendarAccountRecord;
      userId: string;
    }
  | {
      ok: false;
      status: 401 | 403 | 404;
      error: string;
      code?: string;
    };

async function resolveUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  return email ? normalizeSubscriptionUserId(email) : null;
}

export async function getConnectableCalendarTokens(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: shouldUseSecureCookies(),
  });

  if (token?.accessToken) {
    return {
      accessToken: token.accessToken as string,
      refreshToken: (token.refreshToken as string | undefined) ?? null,
      accessTokenExpires: token.accessTokenExpires as number | undefined,
    };
  }

  const session = await getServerSession(authOptions);
  if (session?.accessToken) {
    return {
      accessToken: session.accessToken,
      refreshToken: null as string | null,
      accessTokenExpires: undefined as number | undefined,
    };
  }

  return null;
}

export async function getCalendarAuthClient(
  request?: NextRequest
): Promise<CalendarAuthResult> {
  const userId = await resolveUserId();
  if (!userId) {
    return { ok: false, status: 401, error: "Not authenticated.", code: "UNAUTHENTICATED" };
  }

  let account = await calendarAccountRepository.getPrimary(userId, "google");

  // Soft fallback: reuse Gmail account tokens if Calendar row missing (after re-consent).
  if (!account && request) {
    const tokens = await getConnectableCalendarTokens(request);
    if (tokens?.accessToken) {
      // Caller should POST /api/calendar/connect — we don't invent a row here.
    }
  }

  if (!account) {
    return {
      ok: false,
      status: 404,
      error: "Google Calendar is not connected.",
      code: "CALENDAR_NOT_CONNECTED",
    };
  }

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
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          tokenExpiresAt: refreshed.expiresAt,
        }
      );
      account = {
        ...account,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        tokenExpiresAt: refreshed.expiresAt,
      };
    } catch {
      return {
        ok: false,
        status: 403,
        error: "Calendar session expired. Reconnect Google Calendar.",
        code: "OAUTH_EXPIRED",
      };
    }
  }

  const oauth2Client = applyOAuthCredentials(createOAuth2Client(), {
    accessToken,
    refreshToken,
  });

  return { ok: true, oauth2Client, account, userId };
}

export async function connectCalendarFromTokens(input: {
  userId: string;
  accessToken: string;
  refreshToken?: string | null;
  accessTokenExpires?: number;
}): Promise<CalendarAccountRecord> {
  const client = applyOAuthCredentials(createOAuth2Client(), {
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
  });

  let accountEmail: string;
  try {
    accountEmail = await getGmailProfileEmail(client);
  } catch {
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const me = await oauth2.userinfo.get();
    accountEmail = (me.data.email ?? "").trim().toLowerCase();
    if (!accountEmail) {
      throw new Error("Could not resolve Google account email.");
    }
  }

  const expiresAt = input.accessTokenExpires
    ? new Date(input.accessTokenExpires).toISOString()
    : new Date(Date.now() + 3600 * 1000).toISOString();

  const account = await calendarAccountRepository.upsert({
    userId: input.userId,
    provider: "google",
    accountEmail,
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    tokenExpiresAt: expiresAt,
    scopes: [...GOOGLE_CALENDAR_SCOPES],
  });

  // Keep Gmail tokens in sync when the same Google account is connected,
  // so incremental Calendar consent does not orphan Gmail refresh tokens.
  try {
    const gmailAccounts = await gmailAccountRepository.listAccounts(input.userId);
    const match = gmailAccounts.find(
      (a) => a.email.toLowerCase() === accountEmail.toLowerCase()
    );
    if (match && input.refreshToken) {
      await gmailAccountRepository.updateTokens(input.userId, match.email, {
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        tokenExpiresAt: expiresAt,
      });
    }
  } catch (error) {
    console.warn("[calendar/auth] gmail token sync skipped", error);
  }

  return account;
}
