import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { gmailAccountRepository } from "@/lib/gmail/repository";
import {
  applyOAuthCredentials,
  createOAuth2Client,
  isTokenExpired,
  refreshOAuthTokens,
} from "@/lib/gmail/oauth";

export type GmailAuthResult =
  | {
      ok: true;
      oauth2Client: InstanceType<typeof google.auth.OAuth2>;
      accountEmail: string;
      userId: string;
    }
  | {
      ok: false;
      status: 401 | 403;
      error: string;
    };

async function resolveUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.email ?? null;
}

async function resolveSessionTokens(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.accessToken) {
    return null;
  }

  return {
    accessToken: token.accessToken as string,
    refreshToken: token.refreshToken as string | undefined,
    accessTokenExpires: token.accessTokenExpires as number | undefined,
  };
}

export async function getGmailAuthClient(
  request: NextRequest
): Promise<GmailAuthResult> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;

  if (!session || !userId) {
    return {
      ok: false,
      status: 401,
      error: "Not authenticated. Please sign in with Google.",
    };
  }

  const sessionTokens = await resolveSessionTokens(request);
  const storedAccount = await gmailAccountRepository.getPrimaryAccount(userId);

  let accessToken = sessionTokens?.accessToken ?? storedAccount?.accessToken;
  let refreshToken =
    sessionTokens?.refreshToken ?? storedAccount?.refreshToken ?? undefined;
  let tokenExpiresAt =
    sessionTokens?.accessTokenExpires != null
      ? new Date(sessionTokens.accessTokenExpires).toISOString()
      : storedAccount?.tokenExpiresAt;

  if (!accessToken) {
    return {
      ok: false,
      status: 403,
      error:
        "Gmail is not connected. Connect your Gmail account from the dashboard.",
    };
  }

  if (
    refreshToken &&
    isTokenExpired(tokenExpiresAt) &&
    storedAccount?.email
  ) {
    try {
      const refreshed = await refreshOAuthTokens(refreshToken);
      accessToken = refreshed.accessToken;
      refreshToken = refreshed.refreshToken;
      tokenExpiresAt = refreshed.expiresAt;

      await gmailAccountRepository.updateTokens(userId, storedAccount.email, {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        tokenExpiresAt: refreshed.expiresAt,
      });
    } catch {
      return {
        ok: false,
        status: 403,
        error:
          "Gmail session expired. Reconnect your Gmail account to continue syncing.",
      };
    }
  }

  const oauth2Client = applyOAuthCredentials(createOAuth2Client(), {
    accessToken,
    refreshToken,
  });

  const accountEmail = storedAccount?.email ?? session.user?.email ?? userId;

  return { ok: true, oauth2Client, accountEmail, userId };
}

export async function getConnectableTokens(request: NextRequest): Promise<
  | {
      ok: true;
      userId: string;
      accessToken: string;
      refreshToken?: string;
      tokenExpiresAt: string | null;
    }
  | { ok: false; status: 401 | 403; error: string }
> {
  const userId = await resolveUserId();
  if (!userId) {
    return { ok: false, status: 401, error: "Not authenticated." };
  }

  const sessionTokens = await resolveSessionTokens(request);
  if (!sessionTokens?.accessToken) {
    return {
      ok: false,
      status: 403,
      error:
        "Gmail access not granted. Sign in with Google to authorize Gmail.",
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
