import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { getGmailAuthClient } from "@/lib/gmail-auth";
import { listGmailLabels } from "@/lib/gmail";

export async function GET(request: NextRequest) {
  const auth = await getGmailAuthClient(request);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const labels = await listGmailLabels(auth.oauth2Client);
    return NextResponse.json({ labels });
  } catch (error) {
    console.error("[gmail/labels] Failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load labels.",
      },
      { status: 500 }
    );
  }
}
