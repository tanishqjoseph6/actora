import { NextRequest, NextResponse } from "next/server";
import { getGmailAuthClient } from "@/lib/gmail-auth";
import { bulkModifyEmails } from "@/lib/gmail";

export async function POST(request: NextRequest) {
  const auth = await getGmailAuthClient(request);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as {
    ids?: string[];
    action?: "archive" | "read" | "star" | "unstar";
  };

  const ids = body.ids ?? [];
  const action = body.action;

  if (!ids.length || !action) {
    return NextResponse.json(
      { error: "ids and action are required." },
      { status: 400 }
    );
  }

  try {
    const result = await bulkModifyEmails(auth.oauth2Client, ids, action);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[gmail] Bulk action failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Bulk action failed.",
      },
      { status: 500 }
    );
  }
}
