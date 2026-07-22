import type { WorkspacePermission, WorkspaceRole } from "./types";

/**
 * Canonical role → permission matrix.
 * DB seeds mirror this; API always re-validates against this map
 * so frontend role claims are never trusted alone.
 */
export const ROLE_PERMISSIONS: Record<WorkspaceRole, readonly WorkspacePermission[]> = {
  owner: [
    "billing",
    "analytics",
    "crm",
    "inbox",
    "calendar",
    "tasks",
    "automations",
    "roxx_ai",
    "settings",
    "members",
    "credits",
  ],
  admin: [
    "analytics",
    "crm",
    "inbox",
    "calendar",
    "tasks",
    "automations",
    "roxx_ai",
    "settings",
    "members",
    "credits",
  ],
  member: [
    "analytics",
    "crm",
    "inbox",
    "calendar",
    "tasks",
    "automations",
    "roxx_ai",
  ],
  viewer: ["analytics", "crm", "inbox", "calendar", "tasks", "automations"],
};

export function permissionsForRole(role: WorkspaceRole): WorkspacePermission[] {
  return [...ROLE_PERMISSIONS[role]];
}

export function roleHasPermission(
  role: WorkspaceRole,
  permission: WorkspacePermission
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canManageBilling(role: WorkspaceRole): boolean {
  return roleHasPermission(role, "billing");
}

export function canPurchaseCredits(role: WorkspaceRole): boolean {
  return roleHasPermission(role, "credits") && (role === "owner" || role === "admin");
}

export function canDeleteWorkspace(role: WorkspaceRole): boolean {
  return role === "owner";
}

export function canTransferOwnership(role: WorkspaceRole): boolean {
  return role === "owner";
}

export function canInviteMembers(role: WorkspaceRole): boolean {
  return roleHasPermission(role, "members");
}

export function canChangeRole(
  actorRole: WorkspaceRole,
  targetRole: WorkspaceRole,
  nextRole: WorkspaceRole
): boolean {
  if (actorRole === "owner") {
    return nextRole !== "owner" && targetRole !== "owner";
  }
  if (actorRole === "admin") {
    return (
      targetRole !== "owner" &&
      targetRole !== "admin" &&
      (nextRole === "member" || nextRole === "viewer")
    );
  }
  return false;
}

export function isWritableRole(role: WorkspaceRole): boolean {
  return role !== "viewer";
}
