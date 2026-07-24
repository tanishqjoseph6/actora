import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  getApiUserEmail,
  unauthenticatedJsonResponse,
} from "@/lib/auth/get-api-user";
import { shouldUseSecureCookies } from "@/lib/auth/nextauth-url";
import { WORKSPACE_COOKIE, workspaceCookieOptions } from "./cookie";
import { roleHasPermission, isWritableRole } from "./permissions";
import {
  ensurePersonalWorkspace,
  getMembershipContext,
  listWorkspacesForUser,
} from "./repository";
import type {
  ActiveWorkspaceContext,
  WorkspacePermission,
} from "./types";

export async function readWorkspaceIdFromCookies(
  request?: NextRequest
): Promise<string | null> {
  if (request) {
    return request.cookies.get(WORKSPACE_COOKIE)?.value ?? null;
  }
  const store = await cookies();
  return store.get(WORKSPACE_COOKIE)?.value ?? null;
}

export async function setActiveWorkspaceCookie(workspaceId: string) {
  const store = await cookies();
  store.set(WORKSPACE_COOKIE, workspaceId, workspaceCookieOptions(shouldUseSecureCookies()));
}

/**
 * Resolve the caller's active workspace.
 * Auto-provisions a personal workspace when none exist.
 * Falls back to first membership if cookie is missing/invalid.
 */
export async function resolveActiveWorkspace(
  userId: string,
  request?: NextRequest,
  displayName?: string | null
): Promise<ActiveWorkspaceContext> {
  await ensurePersonalWorkspace(userId, displayName);
  const workspaces = await listWorkspacesForUser(userId);
  if (workspaces.length === 0) {
    throw new Error("No workspaces available.");
  }

  const cookieId = await readWorkspaceIdFromCookies(request);
  const preferred =
    workspaces.find((w) => w.id === cookieId) ?? workspaces[0];

  const ctx = await getMembershipContext(preferred.id, userId);
  if (!ctx) {
    throw new Error("Workspace membership not found.");
  }

  return {
    workspaceId: ctx.workspace.id,
    workspace: ctx.workspace,
    role: ctx.role,
    permissions: ctx.permissions,
    userId,
  };
}

export type WorkspaceAuthOk = {
  ok: true;
  email: string;
  ctx: ActiveWorkspaceContext;
};

export type WorkspaceAuthErr = {
  ok: false;
  response: Response;
};

/**
 * Authenticate + optionally enforce a workspace permission.
 * Always validates membership server-side — never trusts client role claims.
 */
export async function requireWorkspacePermission(
  permission: WorkspacePermission | null,
  request?: NextRequest
): Promise<WorkspaceAuthOk | WorkspaceAuthErr> {
  const email = await getApiUserEmail(request);
  if (!email) {
    return { ok: false, response: unauthenticatedJsonResponse() };
  }

  let ctx: ActiveWorkspaceContext;
  try {
    ctx = await resolveActiveWorkspace(email, request);
  } catch (error) {
    console.error("[workspace] resolve failed:", error);
    return {
      ok: false,
      response: Response.json(
        { error: "Workspace unavailable.", code: "WORKSPACE_UNAVAILABLE" },
        { status: 503 }
      ),
    };
  }

  if (permission && !roleHasPermission(ctx.role, permission)) {
    return {
      ok: false,
      response: Response.json(
        {
          error: "You do not have permission for this action.",
          code: "FORBIDDEN",
          required: permission,
          role: ctx.role,
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true, email, ctx };
}

export async function requireWritableWorkspacePermission(
  permission: WorkspacePermission,
  request?: NextRequest
): Promise<WorkspaceAuthOk | WorkspaceAuthErr> {
  const auth = await requireWorkspacePermission(permission, request);
  if (!auth.ok) return auth;
  if (!isWritableRole(auth.ctx.role)) {
    return {
      ok: false,
      response: Response.json(
        {
          error: "You do not have permission for this action.",
          code: "FORBIDDEN",
          required: permission,
          role: auth.ctx.role,
        },
        { status: 403 }
      ),
    };
  }
  return auth;
}

export async function requireWorkspaceMembership(
  workspaceId: string,
  request?: NextRequest
): Promise<WorkspaceAuthOk | WorkspaceAuthErr> {
  const email = await getApiUserEmail(request);
  if (!email) {
    return { ok: false, response: unauthenticatedJsonResponse() };
  }

  const membership = await getMembershipContext(workspaceId, email);
  if (!membership) {
    return {
      ok: false,
      response: Response.json(
        { error: "Not a member of this workspace.", code: "FORBIDDEN" },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    email,
    ctx: {
      workspaceId: membership.workspace.id,
      workspace: membership.workspace,
      role: membership.role,
      permissions: membership.permissions,
      userId: email,
    },
  };
}
