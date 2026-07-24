import { requireSupabaseAdmin } from "@/lib/supabase-admin";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import { permissionsForRole } from "./permissions";
import type {
  InviteStatus,
  WorkspaceActivityRecord,
  WorkspaceIcon,
  WorkspaceInvitationRecord,
  WorkspaceMemberRecord,
  WorkspacePermission,
  WorkspaceRecord,
  WorkspaceRole,
  WorkspaceSummary,
} from "./types";

function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "workspace";
}

async function uniqueSlug(base: string): Promise<string> {
  const db = requireSupabaseAdmin();
  let candidate = base;
  for (let i = 0; i < 20; i++) {
    const { data } = await db
      .from("workspaces")
      .select("id")
      .eq("slug", candidate)
      .is("deleted_at", null)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function logWorkspaceActivity(input: {
  workspaceId: string;
  actorUserId: string | null;
  action: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const db = requireSupabaseAdmin();
  await db.from("workspace_activity_logs").insert({
    workspace_id: input.workspaceId,
    actor_user_id: input.actorUserId,
    action: input.action,
    metadata: input.metadata ?? {},
  });
}

export async function createWorkspace(input: {
  name: string;
  ownerUserId: string;
  icon?: WorkspaceIcon | string;
  logoUrl?: string | null;
  planId?: string;
}): Promise<WorkspaceRecord> {
  const db = requireSupabaseAdmin();
  const ownerUserId = normalizeSubscriptionUserId(input.ownerUserId);
  const name = input.name.trim().slice(0, 80) || "Untitled workspace";
  const slug = await uniqueSlug(slugify(name));

  const { data: workspace, error } = await db
    .from("workspaces")
    .insert({
      name,
      slug,
      icon: input.icon ?? "spark",
      logo_url: input.logoUrl ?? null,
      owner_user_id: ownerUserId,
      plan_id: input.planId ?? "free",
    })
    .select("*")
    .single();

  if (error || !workspace) {
    throw new Error(error?.message ?? "Failed to create workspace.");
  }

  const { error: memberError } = await db.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: ownerUserId,
    role_id: "owner",
    status: "active",
  });

  if (memberError) {
    await db.from("workspaces").delete().eq("id", workspace.id);
    throw new Error(memberError.message);
  }

  await logWorkspaceActivity({
    workspaceId: workspace.id,
    actorUserId: ownerUserId,
    action: "workspace.created",
    metadata: { name, slug },
  });

  return workspace as WorkspaceRecord;
}

/**
 * Ensure the user has at least one personal workspace.
 * Creates "{Name}'s Workspace" on first login.
 */
export async function ensurePersonalWorkspace(
  userId: string,
  displayName?: string | null
): Promise<WorkspaceRecord> {
  const db = requireSupabaseAdmin();
  const uid = normalizeSubscriptionUserId(userId);

  const { data: memberships } = await db
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", uid)
    .eq("status", "active")
    .limit(5);

  for (const row of memberships ?? []) {
    const ws = await getWorkspaceById(row.workspace_id);
    if (ws) return ws;
  }

  const label = (displayName?.trim() || uid.split("@")[0] || "My").slice(0, 40);
  return createWorkspace({
    name: `${label}'s Workspace`,
    ownerUserId: uid,
  });
}

export async function listWorkspacesForUser(
  userId: string
): Promise<WorkspaceSummary[]> {
  const db = requireSupabaseAdmin();
  const uid = normalizeSubscriptionUserId(userId);

  const { data, error } = await db
    .from("workspace_members")
    .select(
      `
      id,
      role_id,
      workspace_id,
      workspaces!inner (
        id, name, slug, logo_url, icon, owner_user_id, plan_id, created_at, updated_at, deleted_at
      )
    `
    )
    .eq("user_id", uid)
    .eq("status", "active")
    .is("workspaces.deleted_at", null)
    .order("joined_at", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const summaries: WorkspaceSummary[] = [];

  for (const row of rows) {
    const ws = row.workspaces as unknown as WorkspaceRecord;
    if (!ws || ws.deleted_at) continue;

    const { count } = await db
      .from("workspace_members")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", ws.id)
      .eq("status", "active");

    summaries.push({
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      logoUrl: ws.logo_url,
      icon: ws.icon,
      planId: ws.plan_id,
      role: row.role_id as WorkspaceRole,
      memberCount: count ?? 1,
      createdAt: ws.created_at,
    });
  }

  return summaries;
}

export async function getWorkspaceById(
  workspaceId: string
): Promise<WorkspaceRecord | null> {
  const db = requireSupabaseAdmin();
  const { data } = await db
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as WorkspaceRecord | null) ?? null;
}

export async function getMembership(
  workspaceId: string,
  userId: string
): Promise<WorkspaceMemberRecord | null> {
  const db = requireSupabaseAdmin();
  const uid = normalizeSubscriptionUserId(userId);
  const { data } = await db
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", uid)
    .eq("status", "active")
    .maybeSingle();
  return (data as WorkspaceMemberRecord | null) ?? null;
}

export async function getMembershipContext(
  workspaceId: string,
  userId: string
): Promise<{
  workspace: WorkspaceRecord;
  member: WorkspaceMemberRecord;
  role: WorkspaceRole;
  permissions: WorkspacePermission[];
} | null> {
  const workspace = await getWorkspaceById(workspaceId);
  if (!workspace) return null;
  const member = await getMembership(workspaceId, userId);
  if (!member) return null;
  const role = member.role_id as WorkspaceRole;
  return {
    workspace,
    member,
    role,
    permissions: permissionsForRole(role),
  };
}

export async function updateWorkspace(
  workspaceId: string,
  actorUserId: string,
  patch: {
    name?: string;
    logoUrl?: string | null;
    icon?: string;
  }
): Promise<WorkspaceRecord> {
  const db = requireSupabaseAdmin();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof patch.name === "string") {
    updates.name = patch.name.trim().slice(0, 80);
  }
  if (patch.logoUrl !== undefined) updates.logo_url = patch.logoUrl;
  if (typeof patch.icon === "string") updates.icon = patch.icon;

  const { data, error } = await db
    .from("workspaces")
    .update(updates)
    .eq("id", workspaceId)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Update failed.");

  await logWorkspaceActivity({
    workspaceId,
    actorUserId: normalizeSubscriptionUserId(actorUserId),
    action: "workspace.updated",
    metadata: patch as Record<string, unknown>,
  });

  return data as WorkspaceRecord;
}

export async function softDeleteWorkspace(
  workspaceId: string,
  actorUserId: string
): Promise<void> {
  const db = requireSupabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await db
    .from("workspaces")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", workspaceId)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  await db
    .from("workspace_invitations")
    .update({ status: "revoked" })
    .eq("workspace_id", workspaceId)
    .eq("status", "pending");

  await logWorkspaceActivity({
    workspaceId,
    actorUserId: normalizeSubscriptionUserId(actorUserId),
    action: "workspace.deleted",
  });
}

export async function listMembers(
  workspaceId: string
): Promise<WorkspaceMemberRecord[]> {
  const db = requireSupabaseAdmin();
  const { data, error } = await db
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .order("joined_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as WorkspaceMemberRecord[];
}

export async function updateMemberRole(input: {
  workspaceId: string;
  targetUserId: string;
  nextRole: WorkspaceRole;
  actorUserId: string;
}): Promise<WorkspaceMemberRecord> {
  const db = requireSupabaseAdmin();
  const target = normalizeSubscriptionUserId(input.targetUserId);
  const { data, error } = await db
    .from("workspace_members")
    .update({
      role_id: input.nextRole,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", target)
    .eq("status", "active")
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Role update failed.");

  await logWorkspaceActivity({
    workspaceId: input.workspaceId,
    actorUserId: normalizeSubscriptionUserId(input.actorUserId),
    action: "member.role_changed",
    metadata: { targetUserId: target, role: input.nextRole },
  });

  return data as WorkspaceMemberRecord;
}

export async function removeMember(input: {
  workspaceId: string;
  targetUserId: string;
  actorUserId: string;
}): Promise<void> {
  const db = requireSupabaseAdmin();
  const target = normalizeSubscriptionUserId(input.targetUserId);
  const { error } = await db
    .from("workspace_members")
    .update({
      status: "removed",
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", target)
    .eq("status", "active");

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId: input.workspaceId,
    actorUserId: normalizeSubscriptionUserId(input.actorUserId),
    action: "member.removed",
    metadata: { targetUserId: target },
  });
}

export async function transferOwnership(input: {
  workspaceId: string;
  newOwnerUserId: string;
  actorUserId: string;
}): Promise<void> {
  const db = requireSupabaseAdmin();
  const actor = normalizeSubscriptionUserId(input.actorUserId);
  const nextOwner = normalizeSubscriptionUserId(input.newOwnerUserId);

  if (actor === nextOwner) {
    throw new Error("You already own this workspace.");
  }

  const { data: targetMember, error: targetError } = await db
    .from("workspace_members")
    .select("id, status, role_id")
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", nextOwner)
    .eq("status", "active")
    .maybeSingle();

  if (targetError) throw new Error(targetError.message);
  if (!targetMember) {
    throw new Error("New owner must be an active workspace member.");
  }

  const { data: wsUpdated, error: wsError } = await db
    .from("workspaces")
    .update({
      owner_user_id: nextOwner,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.workspaceId)
    .eq("owner_user_id", actor)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (wsError) throw new Error(wsError.message);
  if (!wsUpdated) {
    throw new Error("Only the current owner can transfer ownership.");
  }

  const { error: demoteError } = await db
    .from("workspace_members")
    .update({ role_id: "admin", updated_at: new Date().toISOString() })
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", actor)
    .eq("status", "active");

  if (demoteError) throw new Error(demoteError.message);

  const { error: promoteError } = await db
    .from("workspace_members")
    .update({ role_id: "owner", updated_at: new Date().toISOString() })
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", nextOwner)
    .eq("status", "active");

  if (promoteError) throw new Error(promoteError.message);

  await logWorkspaceActivity({
    workspaceId: input.workspaceId,
    actorUserId: actor,
    action: "workspace.ownership_transferred",
    metadata: { previousOwner: actor, newOwner: nextOwner },
  });
}

export async function createInvitation(input: {
  workspaceId: string;
  email: string;
  roleId: WorkspaceRole;
  invitedBy: string;
}): Promise<WorkspaceInvitationRecord> {
  const db = requireSupabaseAdmin();
  const email = normalizeSubscriptionUserId(input.email);
  if (input.roleId === "owner") {
    throw new Error("Cannot invite someone as owner. Transfer ownership instead.");
  }

  // Expire / revoke any existing pending invites for same email (one live invite only)
  await db
    .from("workspace_invitations")
    .update({ status: "revoked" })
    .eq("workspace_id", input.workspaceId)
    .eq("email", email)
    .eq("status", "pending");

  const { data: existingMember } = await db
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", email)
    .eq("status", "active")
    .maybeSingle();

  if (existingMember) {
    throw new Error("User is already a member of this workspace.");
  }

  const { data, error } = await db
    .from("workspace_invitations")
    .insert({
      workspace_id: input.workspaceId,
      email,
      role_id: input.roleId,
      invited_by: normalizeSubscriptionUserId(input.invitedBy),
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Invite failed.");

  await logWorkspaceActivity({
    workspaceId: input.workspaceId,
    actorUserId: normalizeSubscriptionUserId(input.invitedBy),
    action: "member.invited",
    metadata: { email, role: input.roleId },
  });

  return data as WorkspaceInvitationRecord;
}

export async function listInvitations(
  workspaceId: string
): Promise<WorkspaceInvitationRecord[]> {
  const db = requireSupabaseAdmin();
  // Mark expired
  await db
    .from("workspace_invitations")
    .update({ status: "expired" })
    .eq("workspace_id", workspaceId)
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString());

  const { data, error } = await db
    .from("workspace_invitations")
    .select(
      "id, workspace_id, email, role_id, invited_by, status, expires_at, accepted_at, accepted_user_id, created_at"
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...(row as Omit<WorkspaceInvitationRecord, "token">),
    token: "",
  }));
}

export async function revokeInvitation(input: {
  invitationId: string;
  workspaceId: string;
  actorUserId: string;
}): Promise<void> {
  const db = requireSupabaseAdmin();
  const { error } = await db
    .from("workspace_invitations")
    .update({ status: "revoked" })
    .eq("id", input.invitationId)
    .eq("workspace_id", input.workspaceId)
    .eq("status", "pending");

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId: input.workspaceId,
    actorUserId: normalizeSubscriptionUserId(input.actorUserId),
    action: "invite.revoked",
    metadata: { invitationId: input.invitationId },
  });
}

export async function acceptInvitation(input: {
  token: string;
  userId: string;
}): Promise<{ workspaceId: string }> {
  const db = requireSupabaseAdmin();
  const uid = normalizeSubscriptionUserId(input.userId);

  const { data: invite, error } = await db
    .from("workspace_invitations")
    .select("*")
    .eq("token", input.token)
    .maybeSingle();

  if (error || !invite) throw new Error("Invitation not found.");

  const record = invite as WorkspaceInvitationRecord;
  if (record.status !== "pending") {
    throw new Error(`Invitation is ${record.status}.`);
  }
  if (new Date(record.expires_at).getTime() < Date.now()) {
    await db
      .from("workspace_invitations")
      .update({ status: "expired" })
      .eq("id", record.id);
    throw new Error("Invitation has expired.");
  }
  if (normalizeSubscriptionUserId(record.email) !== uid) {
    throw new Error("This invitation was sent to a different email address.");
  }

  const workspace = await getWorkspaceById(record.workspace_id);
  if (!workspace) {
    throw new Error("This workspace is no longer available.");
  }

  const { data: existingMember } = await db
    .from("workspace_members")
    .select("id, status, role_id")
    .eq("workspace_id", record.workspace_id)
    .eq("user_id", uid)
    .maybeSingle();

  if (existingMember?.status === "active") {
    // Already a member — consume invite without downgrading role
    await db
      .from("workspace_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        accepted_user_id: uid,
      })
      .eq("id", record.id)
      .eq("status", "pending");
    return { workspaceId: record.workspace_id };
  }

  const { error: memberError } = await db.from("workspace_members").upsert(
    {
      workspace_id: record.workspace_id,
      user_id: uid,
      role_id: record.role_id,
      status: "active",
      joined_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id,user_id" }
  );

  if (memberError) throw new Error(memberError.message);

  const { data: accepted, error: acceptError } = await db
    .from("workspace_invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_user_id: uid,
    })
    .eq("id", record.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (acceptError) throw new Error(acceptError.message);
  if (!accepted) {
    throw new Error("Invitation was already used.");
  }

  await logWorkspaceActivity({
    workspaceId: record.workspace_id,
    actorUserId: uid,
    action: "member.joined",
    metadata: { role: record.role_id, via: "invite" },
  });

  return { workspaceId: record.workspace_id };
}

export async function leaveWorkspace(input: {
  workspaceId: string;
  userId: string;
}): Promise<void> {
  const db = requireSupabaseAdmin();
  const uid = normalizeSubscriptionUserId(input.userId);
  const membership = await getMembership(input.workspaceId, uid);
  if (!membership || membership.status !== "active") {
    throw new Error("You are not a member of this workspace.");
  }
  if (membership.role_id === "owner") {
    throw new Error("Owners must transfer ownership before leaving.");
  }

  const { error } = await db
    .from("workspace_members")
    .update({
      status: "removed",
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", uid)
    .eq("status", "active");

  if (error) throw new Error(error.message);

  await logWorkspaceActivity({
    workspaceId: input.workspaceId,
    actorUserId: uid,
    action: "member.left",
    metadata: { role: membership.role_id },
  });
}

export async function listActivity(
  workspaceId: string,
  limit = 50
): Promise<WorkspaceActivityRecord[]> {
  const db = requireSupabaseAdmin();
  const { data, error } = await db
    .from("workspace_activity_logs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    workspace_id: row.workspace_id,
    actor_user_id: row.actor_user_id,
    action: row.action,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    created_at: row.created_at,
  }));
}

export async function syncWorkspacePlan(
  workspaceId: string,
  planId: string,
  actorUserId?: string | null
): Promise<void> {
  const db = requireSupabaseAdmin();
  await db
    .from("workspaces")
    .update({ plan_id: planId, updated_at: new Date().toISOString() })
    .eq("id", workspaceId)
    .is("deleted_at", null);

  await logWorkspaceActivity({
    workspaceId,
    actorUserId: actorUserId ? normalizeSubscriptionUserId(actorUserId) : null,
    action: "plan.changed",
    metadata: { planId },
  });
}

export type { InviteStatus };
