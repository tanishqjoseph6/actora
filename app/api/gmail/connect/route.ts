import { NextRequest, NextResponse } from "next/server";
import {
  getConnectableTokens,
  syncGmailInboxForUser,
} from "@/lib/gmail-auth";
import { logApiError } from "@/lib/api/log-error";
import { gmailErrorResponse } from "@/lib/gmail/errors";
import { gmailAccountRepository } from "@/lib/gmail/repository";
import {
  applyOAuthCredentials,
  createOAuth2Client,
  getGmailProfileEmail,
} from "@/lib/gmail/oauth";
import { toPublicGmailAccount } from "@/lib/gmail/types";
import { logGmailAuthEnv } from "@/lib/env/gmail-auth";
import {
  canConnectInbox,
  subscriptionProvider,
  toSubscriptionSnapshot,
} from "@/lib/subscription";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const envStatus = logGmailAuthEnv("gmail/connect");

  if (!envStatus.ok) {
    return NextResponse.json(
      {
        error:
          "Gmail connection is not configured on the server. Missing required environment variables.",
        code: "CONFIG_ERROR",
        missing: envStatus.missing,
      },
      { status: 503 }
    );
  }

  const auth = await getConnectableTokens(request);

  if (!auth.ok) {
    console.error("[gmail/connect] Auth failed:", {
      status: auth.status,
      code: auth.code,
      error: auth.error,
    });

    return NextResponse.json(
      { error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  const { userId, accessToken, refreshToken, tokenExpiresAt } = auth;

  try {
    const oauth2Client = applyOAuthCredentials(createOAuth2Client(), {
      accessToken,
      refreshToken,
    });

    const gmailEmail = await getGmailProfileEmail(oauth2Client);

    const existing = await gmailAccountRepository.getAccount(
      userId,
      gmailEmail
    );

    if (!existing) {
      const subscription = await subscriptionProvider.getSubscription(userId);
      const gate = canConnectInbox(subscription.planId, subscription.usage);

      if (!gate.allowed) {
        return NextResponse.json(
          {
            error: gate.reason,
            code: "PLAN_LIMIT",
            limitType: gate.limitType,
          },
          { status: 403 }
        );
      }
    }

    const { account, isNew } = await gmailAccountRepository.upsertAccount(
      userId,
      {
        email: gmailEmail,
        accessToken,
        refreshToken,
        tokenExpiresAt,
      }
    );

    if (isNew) {
      await subscriptionProvider.recordInboxConnection(userId);
    }

    let syncedCount = 0;
    let syncWarning: string | undefined;

    try {
      const emails = await syncGmailInboxForUser(
        userId,
        gmailEmail,
        oauth2Client
      );
      syncedCount = emails.length;
    } catch (syncError) {
      logApiError("gmail/connect", syncError, {
        userId,
        gmailEmail,
        phase: "initial_sync",
      });
      syncWarning =
        "Gmail account connected, but the initial inbox sync failed. Use Sync now to retry.";
    }

    const updatedAccount =
      (await gmailAccountRepository.getAccount(userId, gmailEmail)) ?? account;

    const accounts = await gmailAccountRepository.listAccounts(userId);
    const subscription = await subscriptionProvider.getSubscription(userId);

    return NextResponse.json({
      account: toPublicGmailAccount(updatedAccount),
      isNew,
      reconnected: !isNew,
      syncedCount,
      syncWarning,
      accounts: accounts.map(toPublicGmailAccount),
      subscription: toSubscriptionSnapshot(subscription),
    });
  } catch (error) {
    logApiError("gmail/connect", error, { userId });
    const mapped = gmailErrorResponse(error);

    return NextResponse.json(
      { error: mapped.error, code: mapped.code },
      { status: mapped.status }
    );
  }
}
