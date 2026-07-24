import { after } from "next/server";
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
import { getStoredSubscription } from "@/lib/subscription/repository";
import {
  canConnectInbox,
  subscriptionProvider,
  toSubscriptionSnapshot,
} from "@/lib/subscription";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

export const maxDuration = 60;

/**
 * Persist Gmail OAuth tokens to gmail_accounts, verify the row exists, then respond.
 * Inbox sync runs in after() so the client never hits a serverless timeout.
 */
export async function POST(request: NextRequest) {
  const startedAt = Date.now();

  const auth = await getConnectableTokens(request);

  if (!auth.ok) {
    console.error("[gmail/connect] step:auth-failed", {
      status: auth.status,
      code: auth.code,
      error: auth.error,
      elapsedMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      { error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  const { userId, accessToken, refreshToken, tokenExpiresAt } = auth;

  console.log("[gmail/connect] step:auth-ok", {
    userId,
    hasAccessToken: Boolean(accessToken),
    hasRefreshToken: Boolean(refreshToken),
    tokenExpiresAt,
  });

  try {
    const oauth2Client = applyOAuthCredentials(createOAuth2Client(), {
      accessToken,
      refreshToken,
    });

    console.log("[gmail/connect] step:gmail-profile");
    const gmailEmail = await getGmailProfileEmail(oauth2Client);
    console.log("[gmail/connect] step:gmail-profile-ok", { gmailEmail });

    if (
      normalizeSubscriptionUserId(gmailEmail) !== normalizeSubscriptionUserId(userId)
    ) {
      return NextResponse.json(
        {
          error:
            "Connect the Google account that matches your Actora login email.",
          code: "EMAIL_MISMATCH",
        },
        { status: 403 }
      );
    }

    const existing = await gmailAccountRepository.getAccount(
      userId,
      gmailEmail
    );

    console.log("[gmail/connect] step:existing-check", {
      userId,
      gmailEmail,
      exists: Boolean(existing),
    });

    if (!existing) {
      const [inboxCount, storedPlan] = await Promise.all([
        gmailAccountRepository.countAccounts(userId),
        getStoredSubscription(userId).catch((planError) => {
          logApiError("gmail/connect", planError, {
            userId,
            phase: "plan_lookup",
          });
          return null;
        }),
      ]);

      const planId = storedPlan?.planId ?? "free";
      const gate = canConnectInbox(planId, {
        aiActionsUsed: 0,
        inboxesConnected: inboxCount,
      });

      if (!gate.allowed) {
        console.warn("[gmail/connect] step:plan-limit", {
          userId,
          planId,
          inboxCount,
          reason: gate.reason,
        });
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

    console.log("[gmail/connect] step:upsert", {
      userId,
      gmailEmail,
      hasRefreshToken: Boolean(refreshToken),
    });

    const { account, isNew } = await gmailAccountRepository.upsertAccount(
      userId,
      {
        email: gmailEmail,
        accessToken,
        refreshToken,
        tokenExpiresAt,
      }
    );

    const verified = await gmailAccountRepository.verifyPersisted(
      userId,
      gmailEmail,
      account.id
    );

    console.log("[gmail/connect] step:upsert-verified", {
      userId,
      accountId: verified.id,
      email: verified.email,
      isNew,
      elapsedMs: Date.now() - startedAt,
    });

    if (isNew) {
      try {
        await subscriptionProvider.recordInboxConnection(userId);
      } catch (usageError) {
        logApiError("gmail/connect", usageError, {
          userId,
          gmailEmail,
          phase: "record_inbox_connection",
        });
      }
    }

    after(async () => {
      try {
        console.log("[gmail/connect] step:background-sync-start", {
          userId,
          gmailEmail,
        });
        const emails = await syncGmailInboxForUser(
          userId,
          gmailEmail,
          oauth2Client
        );
        console.log("[gmail/connect] step:background-sync-ok", {
          userId,
          gmailEmail,
          syncedCount: emails.length,
        });
      } catch (syncError) {
        logApiError("gmail/connect", syncError, {
          userId,
          gmailEmail,
          phase: "background_initial_sync",
        });
      }
    });

    const accounts = await gmailAccountRepository.listAccounts(userId);

    let subscriptionSnapshot = null;
    try {
      const subscription = await subscriptionProvider.getSubscription(userId);
      subscriptionSnapshot = toSubscriptionSnapshot(subscription);
    } catch (subError) {
      logApiError("gmail/connect", subError, {
        userId,
        phase: "subscription_snapshot",
      });
    }

    console.log("[gmail/connect] step:response", {
      userId,
      email: verified.email,
      isNew,
      accountCount: accounts.length,
      elapsedMs: Date.now() - startedAt,
    });

    return NextResponse.json({
      account: toPublicGmailAccount(verified),
      isNew,
      reconnected: !isNew,
      syncedCount: 0,
      syncPending: true,
      accounts: accounts.map(toPublicGmailAccount),
      ...(subscriptionSnapshot ? { subscription: subscriptionSnapshot } : {}),
    });
  } catch (error) {
    logApiError("gmail/connect", error, {
      userId,
      phase: "connect",
      elapsedMs: Date.now() - startedAt,
    });
    const mapped = gmailErrorResponse(error);
    const dbMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: mapped.error,
        code: mapped.code,
        details: dbMessage,
      },
      { status: mapped.status }
    );
  }
}
