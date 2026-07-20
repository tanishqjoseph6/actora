import { NextRequest, NextResponse } from "next/server";
import { getGmailAuthClient } from "@/lib/gmail-auth";
import { toggleStarEmail } from "@/lib/gmail";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getGmailAuthClient(request);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  let starred = true;
  try {
    const body = (await request.json()) as { starred?: boolean };
    starred = body.starred ?? true;
  } catch {
    starred = true;
  }

  try {
    await toggleStarEmail(auth.oauth2Client, id, starred);
    return NextResponse.json({ success: true, starred });
  } catch (error) {
    console.error("[gmail] Failed to toggle star:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update star." },
      { status: 500 }
    );
  }
}
