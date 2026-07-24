import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/email/auth-emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { email?: string };

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    );
  }

  try {
    const result = await sendPasswordResetEmail(email);
    if (!result.sent && result.error) {
      console.error("[auth/forgot-password] send failed", {
        email,
        error: result.error,
        skipped: result.skipped,
      });
    }
  } catch (error) {
    console.error("[auth/forgot-password] unexpected", error);
  }

  // Always succeed to avoid email enumeration.
  return NextResponse.json({ ok: true });
}
