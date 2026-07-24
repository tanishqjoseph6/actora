import { checkGmailAuthEnv } from "@/lib/env/gmail-auth";
import { isSupabaseConfigured } from "@/lib/supabase-admin";
import { validateSupabaseProject } from "@/lib/supabase/config";
import { RAZORPAY_CONNECTED } from "@/lib/billing/config";
import { NextResponse } from "next/server";

export async function GET() {
  const gmailEnv = checkGmailAuthEnv();
  const supabaseProject = validateSupabaseProject();

  const ok =
    Boolean(process.env.GOOGLE_CLIENT_ID) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET) &&
    Boolean(process.env.NEXTAUTH_SECRET) &&
    isSupabaseConfigured() &&
    supabaseProject.ok &&
    gmailEnv.ok &&
    (!RAZORPAY_CONNECTED ||
      (Boolean(process.env.RAZORPAY_KEY_ID) &&
        Boolean(process.env.RAZORPAY_KEY_SECRET) &&
        Boolean(process.env.RAZORPAY_WEBHOOK_SECRET)));

  // Production-safe: never expose project refs, URLs, key posture details, or plan IDs.
  return NextResponse.json(
    {
      ok,
      status: ok ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 }
  );
}
