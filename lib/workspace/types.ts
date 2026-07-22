export const WORKSPACE_ROLES = ["owner", "admin", "member", "viewer"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const WORKSPACE_PERMISSIONS = [
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
] as const;
export type WorkspacePermission = (typeof WORKSPACE_PERMISSIONS)[number];

export const INVITE_STATUSES = ["pending", "accepted", "expired", "revoked"] as const;
export type InviteStatus = (typeof INVITE_STATUSES)[number];

export const WORKSPACE_ICONS = [
  "spark",
  "hexagon",
  "orbit",
  "layers",
  "bolt",
  "compass",
  "diamond",
  "wave",
] as const;
export type WorkspaceIcon = (typeof WORKSPACE_ICONS)[number];

export type WorkspaceRecord = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  icon: string;
  owner_user_id: string;
  plan_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type WorkspaceMemberRecord = {
  id: string;
  workspace_id: string;
  user_id: string;
  role_id: WorkspaceRole;
  status: "active" | "removed";
  joined_at: string;
  updated_at: string;
};

export type WorkspaceInvitationRecord = {
  id: string;
  workspace_id: string;
  email: string;
  role_id: WorkspaceRole;
  invited_by: string;
  token: string;
  status: InviteStatus;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
  accepted_user_id: string | null;
};

export type WorkspaceActivityRecord = {
  id: string;
  workspace_id: string;
  actor_user_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type WorkspaceMembership = {
  workspace: WorkspaceRecord;
  role: WorkspaceRole;
  memberId: string;
  permissions: WorkspacePermission[];
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  icon: string;
  planId: string;
  role: WorkspaceRole;
  memberCount: number;
  createdAt: string;
};

export type ActiveWorkspaceContext = {
  workspaceId: string;
  workspace: WorkspaceRecord;
  role: WorkspaceRole;
  permissions: WorkspacePermission[];
  userId: string;
};
