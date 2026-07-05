import { NextRequest, NextResponse } from "next/server";
import { getGmailAuthClient } from "@/lib/gmail-auth";
import { archiveEmail } from "@/lib/gmail";

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
    await archiveEmail(auth.oauth2Client, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[gmail] Failed to archive email:", error);

    const message =
      error instanceof Error ? error.message : "Failed to archive email";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
