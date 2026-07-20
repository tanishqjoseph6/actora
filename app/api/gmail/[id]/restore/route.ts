import { NextRequest, NextResponse } from "next/server";
import { getGmailAuthClient } from "@/lib/gmail-auth";
import { restoreToInbox } from "@/lib/gmail";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getGmailAuthClient(request);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    await restoreToInbox(auth.oauth2Client, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[gmail] Failed to restore to inbox:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to restore email.",
      },
      { status: 500 }
    );
  }
}
