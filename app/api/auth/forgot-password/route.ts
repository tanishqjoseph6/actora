import { NextResponse } from "next/server";
import {
  mapSupabaseAuthError,
} from "@/lib/auth/password-reset";
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

  const result = await sendPasswordResetEmail(email);

  if (result.error) {
    return NextResponse.json(
      { error: mapSupabaseAuthError(result.error) },
      { status: 400 }
    );
  }

  // Always return success to avoid email enumeration.
  return NextResponse.json({
    ok: true,
    sent: result.sent,
    skipped: result.skipped ?? null,
  });
}
