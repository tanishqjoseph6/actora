import { checkGmailAuthEnv } from "@/lib/env/gmail-auth";
import { isSupabaseConfigured } from "@/lib/supabase-admin";
import { validateSupabaseProject } from "@/lib/supabase/config";
import { RAZORPAY_CONNECTED } from "@/lib/billing/config";
import { getRazorpayKeyMode } from "@/lib/billing/razorpay-plans";
import { NextResponse } from "next/server";

export async function GET() {
  const gmailEnv = checkGmailAuthEnv();
  const supabaseProject = validateSupabaseProject();

  const razorpay = {
    connected: RAZORPAY_CONNECTED,
    keyId: Boolean(process.env.RAZORPAY_KEY_ID),
    keySecret: Boolean(process.env.RAZORPAY_KEY_SECRET),
    webhookSecret: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
    mode: getRazorpayKeyMode(),
  };

  const ok =
    Boolean(process.env.GOOGLE_CLIENT_ID) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET) &&
    Boolean(process.env.NEXTAUTH_SECRET) &&
    isSupabaseConfigured() &&
    supabaseProject.ok &&
    gmailEnv.ok &&
    (!RAZORPAY_CONNECTED ||
      (razorpay.keyId && razorpay.keySecret && razorpay.webhookSecret));

  // Production-safe: never expose project refs, URLs, or secret values.
  return NextResponse.json(
    {
      ok,
      status: ok ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks: {
        razorpay,
      },
    },
    { status: ok ? 200 : 503 }
  );
}
