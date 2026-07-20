import { NextRequest, NextResponse } from "next/server";
import { getGmailAuthClient } from "@/lib/gmail-auth";
import { modifyEmailLabels } from "@/lib/gmail";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getGmailAuthClient(request);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    addLabelIds?: string[];
    removeLabelIds?: string[];
  };

  try {
    await modifyEmailLabels(
      auth.oauth2Client,
      id,
      body.addLabelIds ?? [],
      body.removeLabelIds ?? []
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[gmail] Failed to modify labels:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update labels.",
      },
      { status: 500 }
    );
  }
}
