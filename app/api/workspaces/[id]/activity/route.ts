import { NextRequest } from "next/server";
import {
  listActivity,
  requireWorkspaceMembership,
  roleHasPermission,
} from "@/lib/workspace";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireWorkspaceMembership(id, request);
  if (!auth.ok) return auth.response;

  if (!roleHasPermission(auth.ctx.role, "settings") && auth.ctx.role !== "owner") {
    // Members can see limited activity? Spec says audit for admins/owners via settings.
    if (!roleHasPermission(auth.ctx.role, "members")) {
      return Response.json({ error: "Forbidden.", code: "FORBIDDEN" }, { status: 403 });
    }
  }

  try {
    const limit = Math.min(
      100,
      Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 50))
    );
    const activity = await listActivity(id, limit);
    return Response.json({ activity });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load activity." },
      { status: 500 }
    );
  }
}
