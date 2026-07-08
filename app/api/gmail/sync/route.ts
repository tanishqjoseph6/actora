import { NextRequest, NextResponse } from "next/server";
import {
  buildAuthClientForAccount,
  syncGmailInboxForUser,
} from "@/lib/gmail-auth";
import { gmailErrorResponse } from "@/lib/gmail/errors";
import { logApiError } from "@/lib/api/log-error";
import { gmailAccountRepository } from "@/lib/gmail/repository";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { toPublicGmailAccount } from "@/lib/gmail/types";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let targetEmail: string | null = request.nextUrl.searchParams.get("account");

  if (!targetEmail) {
    try {
      const body = (await request.json()) as { email?: string };
      targetEmail = body.email ?? null;
    } catch {
      targetEmail = null;
    }
  }

  try {
    const accounts = targetEmail
      ? [await gmailAccountRepository.getAccount(userId, targetEmail)].filter(
          (account): account is NonNullable<typeof account> => account !== null
        )
      : await gmailAccountRepository.listAccounts(userId);

    if (accounts.length === 0) {
      return NextResponse.json(
        {
          error: "No Gmail accounts connected.",
          code: "GMAIL_NOT_CONNECTED",
        },
        { status: 403 }
      );
    }

    const results: Array<{
      email: string;
      syncedCount: number;
      unreadCount: number;
      error?: string;
      code?: string;
    }> = [];

    for (const account of accounts) {
      const auth = await buildAuthClientForAccount(userId, account);

      if (!auth.ok) {
        results.push({
          email: account.email,
          syncedCount: 0,
          unreadCount: 0,
          error: auth.error,
          code: auth.code,
        });
        continue;
      }

      try {
        const emails = await syncGmailInboxForUser(
          userId,
          account.email,
          auth.oauth2Client
        );

        results.push({
          email: account.email,
          syncedCount: emails.length,
          unreadCount: emails.filter((email) => email.unread).length,
        });
      } catch (syncError) {
        logApiError("gmail/sync", syncError, {
          userId,
          email: account.email,
        });
        const mapped = gmailErrorResponse(syncError);
        results.push({
          email: account.email,
          syncedCount: 0,
          unreadCount: 0,
          error: mapped.error,
          code: mapped.code,
        });
      }
    }

    const updatedAccounts = await gmailAccountRepository.listAccounts(userId);
    const hasErrors = results.some((result) => result.error);

    return NextResponse.json(
      {
        results,
        accounts: updatedAccounts.map(toPublicGmailAccount),
      },
      { status: hasErrors ? 207 : 200 }
    );
  } catch (error) {
    logApiError("gmail/sync", error, { userId });
    const mapped = gmailErrorResponse(error);
    return NextResponse.json(
      { error: mapped.error, code: mapped.code },
      { status: mapped.status }
    );
  }
}
