import { NextRequest } from "next/server";
import { getApiUserEmail, unauthenticatedJsonResponse } from "@/lib/auth/get-api-user";
import {
  createWorkspace,
  ensurePersonalWorkspace,
  listWorkspacesForUser,
  resolveActiveWorkspace,
  ROLE_PERMISSIONS,
} from "@/lib/workspace";

export async function GET(request: NextRequest) {
  const email = await getApiUserEmail(request);
  if (!email) return unauthenticatedJsonResponse();

  try {
    await ensurePersonalWorkspace(email);
    const workspaces = await listWorkspacesForUser(email);
    const active = await resolveActiveWorkspace(email, request);

    return Response.json({
      workspaces,
      activeWorkspaceId: active.workspaceId,
      active: {
        id: active.workspace.id,
        name: active.workspace.name,
        slug: active.workspace.slug,
        logoUrl: active.workspace.logo_url,
        icon: active.workspace.icon,
        planId: active.workspace.plan_id,
        role: active.role,
        permissions: active.permissions,
        ownerUserId: active.workspace.owner_user_id,
        createdAt: active.workspace.created_at,
      },
      rolePermissions: ROLE_PERMISSIONS,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Before migration 020 is applied, keep dashboard usable.
    if (/does not exist|schema cache|Could not find the table/i.test(message)) {
      console.warn("[api/workspaces GET] schema not ready:", message);
      return Response.json({
        workspaces: [],
        activeWorkspaceId: null,
        active: null,
        rolePermissions: ROLE_PERMISSIONS,
        schemaPending: true,
      });
    }
    console.error("[api/workspaces GET]", error);
    return Response.json(
      { error: message || "Failed to load workspaces." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const email = await getApiUserEmail(request);
  if (!email) return unauthenticatedJsonResponse();

  try {
    const body = (await request.json()) as {
      name?: string;
      icon?: string;
      logoUrl?: string | null;
    };

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length < 2) {
      return Response.json({ error: "Name must be at least 2 characters." }, { status: 400 });
    }

    const workspace = await createWorkspace({
      name,
      ownerUserId: email,
      icon: body.icon,
      logoUrl: body.logoUrl ?? null,
    });

    return Response.json({ workspace }, { status: 201 });
  } catch (error) {
    console.error("[api/workspaces POST]", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to create workspace." },
      { status: 500 }
    );
  }
}
