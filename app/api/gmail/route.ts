import { NextRequest, NextResponse } from "next/server";
import { getGmailAuthClient } from "@/lib/gmail-auth";
import { fetchInboxEmails } from "@/lib/gmail";

export async function GET(request: NextRequest) {
  const auth = await getGmailAuthClient(request);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const emails = await fetchInboxEmails(auth.oauth2Client);
    const unreadCount = emails.filter((email) => email.unread).length;

    return NextResponse.json({ emails, unreadCount });
  } catch (error) {
    console.error("[gmail] Failed to fetch inbox:", error);

    const message =
      error instanceof Error ? error.message : "Failed to fetch Gmail inbox";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
