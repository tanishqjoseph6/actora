import { NextRequest, NextResponse } from "next/server";
import { getGmailAuthClient } from "@/lib/gmail-auth";
import { gmailErrorResponse } from "@/lib/gmail/errors";
import { gmailAccountRepository } from "@/lib/gmail/repository";
import { fetchInboxEmails } from "@/lib/gmail";
import { toPublicGmailAccount } from "@/lib/gmail/types";

export async function GET(request: NextRequest) {
  const auth = await getGmailAuthClient(request);

  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  try {
    const emails = await fetchInboxEmails(auth.oauth2Client);
    const unreadCount = emails.filter((email) => email.unread).length;

    await gmailAccountRepository.updateSyncStatus(
      auth.userId,
      auth.accountEmail,
      emails.length
    );

    return NextResponse.json({
      emails,
      unreadCount,
      account: toPublicGmailAccount(auth.account),
    });
  } catch (error) {
    console.error("[gmail] Failed to fetch inbox:", error);
    const mapped = gmailErrorResponse(error);

    return NextResponse.json(
      { error: mapped.error, code: mapped.code },
      { status: mapped.status }
    );
  }
}
