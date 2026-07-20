import { NextRequest, NextResponse } from "next/server";
import { getGmailAuthClient } from "@/lib/gmail-auth";
import { gmailErrorResponse } from "@/lib/gmail/errors";
import { gmailAccountRepository } from "@/lib/gmail/repository";
import { fetchInboxEmails } from "@/lib/gmail";
import { toPublicGmailAccount } from "@/lib/gmail/types";
import { linkInboxEmailsToCrm } from "@/lib/crm/email-link";
import { dispatchAutomationTrigger } from "@/lib/automations/dispatcher";

export async function GET(request: NextRequest) {
  const auth = await getGmailAuthClient(request);

  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  try {
    const query = request.nextUrl.searchParams.get("q")?.trim();
    const filter = request.nextUrl.searchParams.get("filter");

    let gmailQuery: string | undefined;
    if (query) {
      gmailQuery = `${query} in:inbox`;
    } else if (filter === "unread") {
      gmailQuery = "is:unread in:inbox";
    } else if (filter === "starred") {
      gmailQuery = "is:starred in:inbox";
    } else if (filter === "priority") {
      gmailQuery = "is:unread in:inbox";
    }

    const emails = await fetchInboxEmails(auth.oauth2Client, {
      maxResults: 50,
      query: gmailQuery,
    });
    const unreadCount = emails.filter((email) => email.unread).length;

    await gmailAccountRepository.updateSyncStatus(
      auth.userId,
      auth.accountEmail,
      emails.length
    );

    void linkInboxEmailsToCrm(
      auth.userId,
      emails.map((e) => ({
        id: e.id,
        sender: e.sender,
        subject: e.subject,
        preview: e.preview,
      }))
    ).catch((err) => console.error("[crm] email link failed:", err));

    // Fire Gmail → automations for unread emails (rate-limited to first 3)
    const unread = emails.filter((e) => e.unread).slice(0, 3);
    for (const email of unread) {
      void dispatchAutomationTrigger(auth.userId, "new-email", {
        from: email.sender,
        sender: email.sender,
        subject: email.subject,
        body: email.preview,
        preview: email.preview,
        gmailMessageId: email.id,
        messageId: email.id,
        unread: true,
      }).catch((err) =>
        console.error("[automations] new-email dispatch failed:", err)
      );
    }

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
