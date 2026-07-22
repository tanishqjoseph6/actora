import { NextRequest } from "next/server";
import {
  canDeleteWorkspace,
  requireWorkspaceMembership,
  roleHasPermission,
  softDeleteWorkspace,
  updateWorkspace,
  WORKSPACE_ICONS,
} from "@/lib/workspace";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireWorkspaceMembership(id, request);
  if (!auth.ok) return auth.response;

  return Response.json({
    workspace: auth.ctx.workspace,
    role: auth.ctx.role,
    permissions: auth.ctx.permissions,
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireWorkspaceMembership(id, request);
  if (!auth.ok) return auth.response;

  if (!roleHasPermission(auth.ctx.role, "settings")) {
    return Response.json(
      { error: "Only owners and admins can update workspace settings.", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      logoUrl?: string | null;
      icon?: string;
    };

    if (body.icon && !WORKSPACE_ICONS.includes(body.icon as (typeof WORKSPACE_ICONS)[number])) {
      return Response.json({ error: "Invalid icon." }, { status: 400 });
    }

    if (typeof body.name === "string" && body.name.trim().length < 2) {
      return Response.json({ error: "Name must be at least 2 characters." }, { status: 400 });
    }

    // Cap logo data URLs to ~500KB encoded
    if (
      typeof body.logoUrl === "string" &&
      body.logoUrl.startsWith("data:") &&
      body.logoUrl.length > 700_000
    ) {
      return Response.json({ error: "Logo is too large. Use an image under ~500KB." }, { status: 400 });
    }

    const workspace = await updateWorkspace(id, auth.email, {
      name: body.name,
      logoUrl: body.logoUrl,
      icon: body.icon,
    });

    return Response.json({ workspace });
  } catch (error) {
    console.error("[api/workspaces PATCH]", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Update failed." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireWorkspaceMembership(id, request);
  if (!auth.ok) return auth.response;

  if (!canDeleteWorkspace(auth.ctx.role)) {
    return Response.json(
      { error: "Only the owner can delete a workspace.", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  try {
    await softDeleteWorkspace(id, auth.email);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/workspaces DELETE]", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Delete failed." },
      { status: 500 }
    );
  }
}
