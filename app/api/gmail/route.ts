import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { fetchInboxEmails } from "@/lib/gmail";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!session) {
    return NextResponse.json(
      { error: "Not authenticated. Please sign in with Google." },
      { status: 401 }
    );
  }

  if (!token?.accessToken) {
    return NextResponse.json(
      {
        error:
          "Gmail access not granted. Sign out and sign in again to authorize Gmail.",
      },
      { status: 403 }
    );
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: token.accessToken as string,
      refresh_token: token.refreshToken as string | undefined,
    });

    const emails = await fetchInboxEmails(oauth2Client);
    const unreadCount = emails.filter((email) => email.unread).length;

    return NextResponse.json({ emails, unreadCount });
  } catch (error) {
    console.error("[gmail] Failed to fetch inbox:", error);

    const message =
      error instanceof Error ? error.message : "Failed to fetch Gmail inbox";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
