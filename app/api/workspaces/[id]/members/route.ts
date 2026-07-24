import { NextRequest } from "next/server";
import {
  canChangeRole,
  canTransferOwnership,
  leaveWorkspace,
  listMembers,
  removeMember,
  requireWorkspaceMembership,
  roleHasPermission,
  transferOwnership,
  updateMemberRole,
  WORKSPACE_ROLES,
  type WorkspaceRole,
} from "@/lib/workspace";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireWorkspaceMembership(id, request);
  if (!auth.ok) return auth.response;

  try {
    const members = await listMembers(id);
    return Response.json({ members });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to list members." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireWorkspaceMembership(id, request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as {
      userId?: string;
      role?: string;
      action?: "update_role" | "remove" | "transfer_ownership" | "leave";
    };

    if (body.action === "leave") {
      await leaveWorkspace({
        workspaceId: id,
        userId: auth.email,
      });
      return Response.json({ ok: true });
    }

    if (!roleHasPermission(auth.ctx.role, "members")) {
      return Response.json({ error: "Forbidden.", code: "FORBIDDEN" }, { status: 403 });
    }

    const targetUserId = body.userId?.trim();
    if (!targetUserId) {
      return Response.json({ error: "userId is required." }, { status: 400 });
    }

    const normalizedTarget = normalizeSubscriptionUserId(targetUserId);
    const normalizedActor = normalizeSubscriptionUserId(auth.email);

    if (body.action === "remove") {
      if (normalizedTarget === normalizedActor) {
        return Response.json(
          { error: "You cannot remove yourself. Use leave instead." },
          { status: 400 }
        );
      }
      const members = await listMembers(id);
      const target = members.find((m) => m.user_id === normalizedTarget);
      if (!target) {
        return Response.json({ error: "Member not found." }, { status: 404 });
      }
      if (target.role_id === "owner") {
        return Response.json({ error: "Cannot remove the owner." }, { status: 400 });
      }
      if (auth.ctx.role === "admin" && target.role_id === "admin") {
        return Response.json(
          { error: "Admins cannot remove other admins." },
          { status: 403 }
        );
      }
      await removeMember({
        workspaceId: id,
        targetUserId: normalizedTarget,
        actorUserId: auth.email,
      });
      return Response.json({ ok: true });
    }

    if (body.action === "transfer_ownership") {
      if (!canTransferOwnership(auth.ctx.role)) {
        return Response.json(
          { error: "Only the owner can transfer ownership." },
          { status: 403 }
        );
      }
      if (normalizedTarget === normalizedActor) {
        return Response.json(
          { error: "You already own this workspace." },
          { status: 400 }
        );
      }
      const members = await listMembers(id);
      const target = members.find((m) => m.user_id === normalizedTarget);
      if (!target) {
        return Response.json({ error: "Member not found." }, { status: 404 });
      }
      await transferOwnership({
        workspaceId: id,
        newOwnerUserId: normalizedTarget,
        actorUserId: auth.email,
      });
      return Response.json({ ok: true });
    }

    const nextRole = body.role as WorkspaceRole | undefined;
    if (!nextRole || !WORKSPACE_ROLES.includes(nextRole) || nextRole === "owner") {
      return Response.json({ error: "Invalid role." }, { status: 400 });
    }

    const members = await listMembers(id);
    const target = members.find((m) => m.user_id === normalizedTarget);
    if (!target) {
      return Response.json({ error: "Member not found." }, { status: 404 });
    }

    if (!canChangeRole(auth.ctx.role, target.role_id as WorkspaceRole, nextRole)) {
      return Response.json(
        { error: "You cannot assign that role.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const member = await updateMemberRole({
      workspaceId: id,
      targetUserId: normalizedTarget,
      nextRole,
      actorUserId: auth.email,
    });

    return Response.json({ member });
  } catch (error) {
    console.error("[api/workspaces/members]", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Member update failed." },
      { status: 500 }
    );
  }
}
