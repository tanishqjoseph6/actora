import { NextRequest } from "next/server";
import {
  canInviteMembers,
  createInvitation,
  listInvitations,
  requireWorkspaceMembership,
  revokeInvitation,
  WORKSPACE_ROLES,
  type WorkspaceRole,
} from "@/lib/workspace";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireWorkspaceMembership(id, request);
  if (!auth.ok) return auth.response;

  if (!canInviteMembers(auth.ctx.role)) {
    return Response.json({ error: "Forbidden.", code: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const invitations = await listInvitations(id);
    return Response.json({ invitations });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to list invitations." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireWorkspaceMembership(id, request);
  if (!auth.ok) return auth.response;

  if (!canInviteMembers(auth.ctx.role)) {
    return Response.json({ error: "Forbidden.", code: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { email?: string; role?: string };
    const email = body.email?.trim().toLowerCase();
    const role = (body.role ?? "member") as WorkspaceRole;

    if (!email || !email.includes("@")) {
      return Response.json({ error: "Valid email is required." }, { status: 400 });
    }
    if (!WORKSPACE_ROLES.includes(role) || role === "owner") {
      return Response.json({ error: "Invalid role." }, { status: 400 });
    }
    if (auth.ctx.role === "admin" && role === "admin") {
      return Response.json(
        { error: "Admins can invite members and viewers only." },
        { status: 403 }
      );
    }

    const invitation = await createInvitation({
      workspaceId: id,
      email,
      roleId: role,
      invitedBy: auth.email,
    });

    // Invite link for product UI (email delivery can be wired later)
    const origin = request.nextUrl.origin;
    const inviteUrl = `${origin}/dashboard/settings?invite=${invitation.token}#workspace-members`;

    return Response.json({ invitation, inviteUrl }, { status: 201 });
  } catch (error) {
    console.error("[api/workspaces/invites POST]", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Invite failed." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireWorkspaceMembership(id, request);
  if (!auth.ok) return auth.response;

  if (!canInviteMembers(auth.ctx.role)) {
    return Response.json({ error: "Forbidden.", code: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const invitationId = request.nextUrl.searchParams.get("invitationId");
    if (!invitationId) {
      return Response.json({ error: "invitationId is required." }, { status: 400 });
    }

    await revokeInvitation({
      invitationId,
      workspaceId: id,
      actorUserId: auth.email,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Revoke failed." },
      { status: 500 }
    );
  }
}
