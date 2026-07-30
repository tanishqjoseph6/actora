import { NextRequest, NextResponse } from "next/server";
import { getApiUserEmail, unauthenticatedJsonResponse } from "@/lib/auth/get-api-user";
import { shouldUseSecureCookies } from "@/lib/auth/nextauth-url";
import {
  acceptInvitation,
  getInvitationByToken,
  WORKSPACE_COOKIE,
  workspaceCookieOptions,
} from "@/lib/workspace";
import { createUserNotification } from "@/lib/notifications/repository";
import { getGrowthPreferences } from "@/lib/growth/repository";

export async function POST(request: NextRequest) {
  const email = await getApiUserEmail(request);
  if (!email) return unauthenticatedJsonResponse();

  try {
    const body = (await request.json()) as { token?: string };
    const token = body.token?.trim();
    if (!token) {
      return NextResponse.json({ error: "token is required." }, { status: 400 });
    }

    // Capture inviter before accept consumes the invite
    const preview = await getInvitationByToken(token);
    const { workspaceId } = await acceptInvitation({ token, userId: email });

    if (preview?.invited_by) {
      try {
        const prefs = await getGrowthPreferences(preview.invited_by);
        if (prefs.notifyInvites) {
          await createUserNotification(preview.invited_by, {
            category: "Invites",
            title: "Invite accepted",
            body: `${email} joined your workspace.`,
            href: "/dashboard/settings#workspace-members",
          });
        }
      } catch {
        /* best-effort */
      }
    }

    const response = NextResponse.json({ ok: true, workspaceId });
    response.cookies.set(
      WORKSPACE_COOKIE,
      workspaceId,
      workspaceCookieOptions(shouldUseSecureCookies())
    );
    return response;
  } catch (error) {
    console.error("[api/workspaces/invitations/accept]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Accept failed." },
      { status: 400 }
    );
  }
}
