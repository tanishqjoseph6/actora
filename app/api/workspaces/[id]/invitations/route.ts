import { NextRequest } from "next/server";
import {
  canInviteMembers,
  createInvitation,
  getWorkspaceById,
  listInvitations,
  requireWorkspaceMembership,
  revokeInvitation,
  resendInvitation,
  WORKSPACE_ROLES,
  type WorkspaceRole,
} from "@/lib/workspace";
import { sendWorkspaceInvitationEmail } from "@/lib/email/workspace-invite";
import { getAppUrl } from "@/lib/email/config";
import { createUserNotification } from "@/lib/notifications/repository";
import { trackEngagement } from "@/lib/growth/engagement";

type Params = { params: Promise<{ id: string }> };

function publicInvitation(invitation: {
  id: string;
  workspace_id: string;
  email: string;
  role_id: string;
  invited_by: string;
  status: string;
  expires_at: string;
  accepted_at: string | null;
  accepted_user_id: string | null;
  created_at: string;
  token?: string;
}) {
  const { token: _token, ...rest } = invitation;
  return rest;
}

function invitePageUrl(token: string) {
  return `${getAppUrl()}/invite/${token}`;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireWorkspaceMembership(id, request);
  if (!auth.ok) return auth.response;

  if (!canInviteMembers(auth.ctx.role)) {
    return Response.json({ error: "Forbidden.", code: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const invitations = await listInvitations(id);
    return Response.json({
      invitations: invitations.map(publicInvitation),
    });
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

    const inviteUrl = invitePageUrl(invitation.token);

    const workspace = await getWorkspaceById(id);
    void sendWorkspaceInvitationEmail({
      to: email,
      workspaceName: workspace?.name ?? "Actora workspace",
      inviterEmail: auth.email,
      roleLabel: role === "admin" ? "Admin" : role === "viewer" ? "Viewer" : "Member",
      inviteUrl,
    }).catch((err) => {
      console.error("[api/workspaces/invites] email failed", err);
    });

    void trackEngagement({
      userId: auth.email,
      achievementId: "first_teammate",
    });

    return Response.json(
      { invitation: publicInvitation(invitation), inviteSent: true, inviteUrl },
      { status: 201 }
    );
  } catch (error) {
    console.error("[api/workspaces/invites POST]", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Invite failed." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireWorkspaceMembership(id, request);
  if (!auth.ok) return auth.response;

  if (!canInviteMembers(auth.ctx.role)) {
    return Response.json({ error: "Forbidden.", code: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      invitationId?: string;
      action?: string;
    };
    if (!body.invitationId || body.action !== "resend") {
      return Response.json(
        { error: "invitationId and action=resend required." },
        { status: 400 }
      );
    }

    const invitation = await resendInvitation({
      invitationId: body.invitationId,
      workspaceId: id,
      actorUserId: auth.email,
    });

    const inviteUrl = invitePageUrl(invitation.token);
    const workspace = await getWorkspaceById(id);
    void sendWorkspaceInvitationEmail({
      to: invitation.email,
      workspaceName: workspace?.name ?? "Actora workspace",
      inviterEmail: auth.email,
      roleLabel:
        invitation.role_id === "admin"
          ? "Admin"
          : invitation.role_id === "viewer"
            ? "Viewer"
            : "Member",
      inviteUrl,
    }).catch((err) => {
      console.error("[api/workspaces/invites] resend email failed", err);
    });

    void createUserNotification(auth.email, {
      category: "Invites",
      title: "Invitation resent",
      body: `Resent invite to ${invitation.email}`,
      href: "/dashboard/settings#workspace-members",
    });

    return Response.json({
      invitation: publicInvitation(invitation),
      inviteUrl,
      inviteSent: true,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Resend failed." },
      { status: 400 }
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
