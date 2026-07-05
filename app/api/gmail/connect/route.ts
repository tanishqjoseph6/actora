import { NextRequest, NextResponse } from "next/server";
import {
  getConnectableTokens,
  syncGmailInboxForUser,
} from "@/lib/gmail-auth";
import { gmailAccountRepository } from "@/lib/gmail/repository";
import {
  applyOAuthCredentials,
  createOAuth2Client,
  getGmailProfileEmail,
} from "@/lib/gmail/oauth";
import { toPublicGmailAccount } from "@/lib/gmail/types";
import {
  canConnectInbox,
  subscriptionProvider,
  toSubscriptionSnapshot,
} from "@/lib/subscription";

export async function POST(request: NextRequest) {
  const auth = await getConnectableTokens(request);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
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

    const emails = await syncGmailInboxForUser(
      userId,
      gmailEmail,
      oauth2Client
    );

    const updatedAccount =
      (await gmailAccountRepository.getAccount(userId, gmailEmail)) ?? account;

    const subscription = await subscriptionProvider.getSubscription(userId);

    return NextResponse.json({
      account: toPublicGmailAccount(updatedAccount),
      isNew,
      syncedCount: emails.length,
      unreadCount: emails.filter((email) => email.unread).length,
      subscription: toSubscriptionSnapshot(subscription),
    });
  } catch (error) {
    console.error("[gmail] Failed to connect account:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to connect Gmail account.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
