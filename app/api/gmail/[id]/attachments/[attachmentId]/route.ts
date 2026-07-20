import { NextRequest, NextResponse } from "next/server";
import { getGmailAuthClient } from "@/lib/gmail-auth";
import { fetchAttachmentData } from "@/lib/gmail";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const auth = await getGmailAuthClient(request);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id, attachmentId } = await params;
  const filename =
    request.nextUrl.searchParams.get("filename") ?? "attachment";
  const mimeType =
    request.nextUrl.searchParams.get("mimeType") ?? "application/octet-stream";

  try {
    const attachment = await fetchAttachmentData(
      auth.oauth2Client,
      id,
      attachmentId
    );

    const normalized = attachment.data.replace(/-/g, "+").replace(/_/g, "/");
    const buffer = Buffer.from(normalized, "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    console.error("[gmail/attachment] Failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load attachment.",
      },
      { status: 500 }
    );
  }
}
