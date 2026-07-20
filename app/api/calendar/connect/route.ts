import { after } from "next/server";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import {
  connectCalendarFromTokens,
  getConnectableCalendarTokens,
} from "@/lib/calendar/auth";
import {
  calendarAccountRepository,
  toPublicCalendarAccount,
} from "@/lib/calendar/repository";
import { syncCalendarAccount } from "@/lib/calendar/sync";
import {
  applyOAuthCredentials,
  createOAuth2Client,
} from "@/lib/gmail/oauth";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import { logApiError } from "@/lib/api/log-error";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const userId = normalizeSubscriptionUserId(email);
    const tokens = await getConnectableCalendarTokens(request);

    if (!tokens?.accessToken) {
      return NextResponse.json(
        {
          error: "Google session missing. Re-authenticate to connect Calendar.",
          code: "NEEDS_OAUTH",
        },
        { status: 401 }
      );
    }

    const account = await connectCalendarFromTokens({
      userId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpires: tokens.accessTokenExpires,
    });

    const oauth2Client = applyOAuthCredentials(createOAuth2Client(), {
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
    });

    let syncedCount = 0;
    let syncPending = false;

    try {
      after(async () => {
        try {
          await syncCalendarAccount(userId, account, oauth2Client);
        } catch (error) {
          logApiError("calendar/connect", error, { step: "background-sync" });
        }
      });
      syncPending = true;
    } catch {
      const result = await syncCalendarAccount(userId, account, oauth2Client);
      syncedCount = result.syncedCount;
    }

    const accounts = await calendarAccountRepository.listByUser(userId);

    return NextResponse.json({
      account: toPublicCalendarAccount(account),
      accounts: accounts.map(toPublicCalendarAccount),
      syncedCount,
      syncPending,
    });
  } catch (error) {
    logApiError("calendar/connect", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to connect Google Calendar.",
        code: "CONNECT_FAILED",
      },
      { status: 500 }
    );
  }
}
