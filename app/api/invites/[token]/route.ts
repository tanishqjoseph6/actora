import { NextRequest, NextResponse } from "next/server";
import { getInvitationByToken } from "@/lib/workspace";

type Params = { params: Promise<{ token: string }> };

/** Public invite preview (no auth required). */
export async function GET(_request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token) {
    return NextResponse.json({ error: "token required." }, { status: 400 });
  }

  try {
    const invitation = await getInvitationByToken(token);
    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
    }

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        role: invitation.role_id,
        status: invitation.status,
        expiresAt: invitation.expires_at,
        workspaceName: invitation.workspace_name ?? "Actora workspace",
        invitedBy: invitation.invited_by,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load invite." },
      { status: 500 }
    );
  }
}
