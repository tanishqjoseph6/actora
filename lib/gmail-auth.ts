import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { logApiError } from "@/lib/api/log-error";
import { gmailAccountRepository } from "@/lib/gmail/repository";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import {
  applyOAuthCredentials,
  createOAuth2Client,
  isTokenExpired,
  refreshOAuthTokens,
} from "@/lib/gmail/oauth";
import type { GmailAccountRecord } from "@/lib/gmail/types";

export type GmailAuthResult =
  | {
      ok: true;
      oauth2Client: InstanceType<typeof google.auth.OAuth2>;
      accountEmail: string;
      userId: string;
      account: GmailAccountRecord;
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

async function resolveSessionTokens(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (token?.accessToken) {
    return {
      accessToken: token.accessToken as string,
      refreshToken: token.refreshToken as string | undefined,
      accessTokenExpires: token.accessTokenExpires as number | undefined,
    };
  }

  const session = await getServerSession(authOptions);
  if (session?.accessToken) {
    return {
      accessToken: session.accessToken,
      refreshToken: undefined,
      accessTokenExpires: undefined,
    };
  }

  return null;
}

function resolveAccountEmail(
  request: NextRequest,
  explicitEmail?: string
): string | undefined {
  return (
    explicitEmail ??
    request.nextUrl.searchParams.get("account") ??
    undefined
  );
}

async function refreshStoredAccountTokens(
  userId: string,
  account: GmailAccountRecord
): Promise<
  | { ok: true; accessToken: string; refreshToken: string; tokenExpiresAt: string }
  | { ok: false; error: string; code: string }
> {
  if (!account.refreshToken) {
    return {
      ok: false,
      error:
        "Gmail session expired. Reconnect your Gmail account to continue syncing.",
      code: "OAUTH_EXPIRED",
    };
  }

  try {
    const refreshed = await refreshOAuthTokens(account.refreshToken);
    await gmailAccountRepository.updateTokens(userId, account.email, {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      tokenExpiresAt: refreshed.expiresAt,
    });

    return {
      ok: true,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      tokenExpiresAt: refreshed.expiresAt,
    };
  } catch {
    return {
      ok: false,
      error:
        "Gmail session expired. Reconnect your Gmail account to continue syncing.",
      code: "OAUTH_EXPIRED",
    };
  }
}

export async function getGmailAuthClient(
  request: NextRequest,
  options?: { accountEmail?: string }
): Promise<GmailAuthResult> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email
    ? normalizeSubscriptionUserId(session.user.email)
    : undefined;

  if (!session || !userId) {
    return {
      ok: false,
      status: 401,
      error: "Not authenticated. Please sign in.",
      code: "GMAIL_NOT_CONNECTED",
    };
  }

  const requestedEmail = resolveAccountEmail(request, options?.accountEmail);
  const storedAccount = requestedEmail
    ? await gmailAccountRepository.getAccount(userId, requestedEmail)
    : await gmailAccountRepository.getPrimaryAccount(userId);

  if (!storedAccount) {
    if (requestedEmail) {
      return {
        ok: false,
        status: 404,
        error: "That Gmail account is not connected to your workspace.",
        code: "GMAIL_NOT_CONNECTED",
      };
    }

    return {
      ok: false,
      status: 403,
      error:
        "Gmail is not connected. Connect your Gmail account from the dashboard.",
      code: "GMAIL_NOT_CONNECTED",
    };
  }

  let accessToken = storedAccount.accessToken;
  let refreshToken = storedAccount.refreshToken ?? undefined;
  let tokenExpiresAt = storedAccount.tokenExpiresAt;

  if (isTokenExpired(tokenExpiresAt)) {
    const refreshed = await refreshStoredAccountTokens(userId, storedAccount);
    if (!refreshed.ok) {
      return {
        ok: false,
        status: 403,
        error: refreshed.error,
        code: refreshed.code,
      };
    }
    accessToken = refreshed.accessToken;
    refreshToken = refreshed.refreshToken;
    tokenExpiresAt = refreshed.tokenExpiresAt;
  }

  const oauth2Client = applyOAuthCredentials(createOAuth2Client(), {
    accessToken,
    refreshToken,
  });

  const latestAccount =
    (await gmailAccountRepository.getAccount(userId, storedAccount.email)) ??
    storedAccount;

  return {
    ok: true,
    oauth2Client,
    accountEmail: latestAccount.email,
    userId,
    account: latestAccount,
  };
}

export async function getConnectableTokens(request: NextRequest): Promise<
  | {
      ok: true;
      userId: string;
      accessToken: string;
      refreshToken?: string;
      tokenExpiresAt: string | null;
    }
  | { ok: false; status: 401 | 403; error: string; code: string }
> {
  const userId = await resolveUserId();
  if (!userId) {
    return {
      ok: false,
      status: 401,
      error: "Not authenticated.",
      code: "GMAIL_NOT_CONNECTED",
    };
  }

  const sessionTokens = await resolveSessionTokens(request);
  if (!sessionTokens?.accessToken) {
    logApiError("gmail-auth", new Error("No OAuth access token in session"), {
      userId,
      hasJwt: Boolean(
        await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
      ),
    });

    return {
      ok: false,
      status: 403,
      error:
        "Gmail access not granted. Sign in with Google to authorize Gmail.",
      code: "OAUTH_DENIED",
    };
  }

  return {
    ok: true,
    userId,
    accessToken: sessionTokens.accessToken,
    refreshToken: sessionTokens.refreshToken,
    tokenExpiresAt:
      sessionTokens.accessTokenExpires != null
        ? new Date(sessionTokens.accessTokenExpires).toISOString()
        : null,
  };
}

export async function syncGmailInboxForUser(
  userId: string,
  accountEmail: string,
  oauth2Client: InstanceType<typeof google.auth.OAuth2>
) {
  const { fetchInboxEmails } = await import("@/lib/gmail");
  const emails = await fetchInboxEmails(oauth2Client);
  await gmailAccountRepository.updateSyncStatus(
    userId,
    accountEmail,
    emails.length
  );
  return emails;
}

export async function buildAuthClientForAccount(
  userId: string,
  account: GmailAccountRecord
): Promise<
  | { ok: true; oauth2Client: InstanceType<typeof google.auth.OAuth2> }
  | { ok: false; error: string; code: string }
> {
  let accessToken = account.accessToken;
  let refreshToken = account.refreshToken ?? undefined;

  if (isTokenExpired(account.tokenExpiresAt)) {
    const refreshed = await refreshStoredAccountTokens(userId, account);
    if (!refreshed.ok) {
      return { ok: false, error: refreshed.error, code: refreshed.code };
    }
    accessToken = refreshed.accessToken;
    refreshToken = refreshed.refreshToken;
  }

  const oauth2Client = applyOAuthCredentials(createOAuth2Client(), {
    accessToken,
    refreshToken,
  });

  return { ok: true, oauth2Client };
}
