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
import { logGmailAuthEnv } from "@/lib/env/gmail-auth";
import { logSupabaseProjectValidation } from "@/lib/supabase/config";
import {
  canConnectInbox,
  subscriptionProvider,
  toSubscriptionSnapshot,
} from "@/lib/subscription";

export const maxDuration = 60;

/**
 * Persist Gmail OAuth tokens to gmail_accounts, then return immediately.
 * Initial inbox sync runs in the background via after() so the client
 * never hits a serverless timeout → TypeError: fetch failed.
 */
export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const envStatus = logGmailAuthEnv("gmail/connect");
  logSupabaseProjectValidation("gmail/connect");

  console.log("[gmail/connect] step:start", {
    envOk: envStatus.ok,
    missing: envStatus.missing,
    googleCallbackUrl: envStatus.googleCallbackUrl,
  });

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
      const subscription = await subscriptionProvider.getSubscription(userId);
      const gate = canConnectInbox(subscription.planId, subscription.usage);

      if (!gate.allowed) {
        console.warn("[gmail/connect] step:plan-limit", {
          userId,
          planId: subscription.planId,
          inboxesConnected: subscription.usage.inboxesConnected,
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

    console.log("[gmail/connect] step:upsert-ok", {
      userId,
      accountId: account.id,
      email: account.email,
      isNew,
      elapsedMs: Date.now() - startedAt,
    });

    if (isNew) {
      try {
        await subscriptionProvider.recordInboxConnection(userId);
      } catch (usageError) {
        // Account is already saved — do not fail the connect response.
        logApiError("gmail/connect", usageError, {
          userId,
          gmailEmail,
          phase: "record_inbox_connection",
        });
      }
    }

    // Defer heavy Gmail inbox sync so the HTTP response is not killed by
    // serverless timeout (root cause of client TypeError: fetch failed).
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
      email: account.email,
      isNew,
      accountCount: accounts.length,
      elapsedMs: Date.now() - startedAt,
    });

    return NextResponse.json({
      account: toPublicGmailAccount(account),
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

    return NextResponse.json(
      { error: mapped.error, code: mapped.code },
      { status: mapped.status }
    );
  }
}
