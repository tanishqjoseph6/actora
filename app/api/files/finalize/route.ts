import { NextRequest, NextResponse } from "next/server";
import { requireWritableWorkspacePermission } from "@/lib/workspace/require";
import { finalizeWorkspaceFile } from "@/lib/storage/repository";

export async function POST(request: NextRequest) {
  const auth = await requireWritableWorkspacePermission("files", request);
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const fileId = typeof body.fileId === "string" ? body.fileId : "";
    const result = await finalizeWorkspaceFile(
      auth.ctx.workspaceId,
      fileId,
      Number(body.actualSize),
      typeof body.checksum === "string" ? body.checksum : undefined,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Could not finalize upload.",
      code: "UPLOAD_FINALIZE_FAILED",
    }, { status: 400 });
  }
}
