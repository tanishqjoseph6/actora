import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export type GmailAuthResult =
  | {
      ok: true;
      oauth2Client: InstanceType<typeof google.auth.OAuth2>;
    }
  | {
      ok: false;
      status: 401 | 403;
      error: string;
    };

export async function getGmailAuthClient(
  request: NextRequest
): Promise<GmailAuthResult> {
  const session = await getServerSession(authOptions);
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!session) {
    return {
      ok: false,
      status: 401,
      error: "Not authenticated. Please sign in with Google.",
    };
  }

  if (!token?.accessToken) {
    return {
      ok: false,
      status: 403,
      error:
        "Gmail access not granted. Sign out and sign in again to authorize Gmail.",
    };
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: token.accessToken as string,
    refresh_token: token.refreshToken as string | undefined,
  });

  return { ok: true, oauth2Client };
}
