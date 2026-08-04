import { NextRequest, NextResponse } from "next/server";
import { requireWritableWorkspacePermission } from "@/lib/workspace/require";
import { reserveWorkspaceFile } from "@/lib/storage/repository";

export async function POST(request: NextRequest) {
  const auth = await requireWritableWorkspacePermission("files", request);
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const result = await reserveWorkspaceFile({
      workspaceId: auth.ctx.workspaceId,
      userId: auth.email,
      name: typeof body.name === "string" ? body.name : "",
      mimeType: typeof body.mimeType === "string" ? body.mimeType : "application/octet-stream",
      sizeBytes: Number(body.sizeBytes),
      folderPath: typeof body.folderPath === "string" ? body.folderPath : "/",
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const status = error instanceof Error && error.name === "STORAGE_LIMIT_REACHED" ? 413 : 400;
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Could not initialize upload.",
      code: status === 413 ? "STORAGE_LIMIT_REACHED" : "UPLOAD_INVALID",
    }, { status });
  }
}
