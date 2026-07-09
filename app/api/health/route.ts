import { NextResponse } from "next/server";
import { getGoogleOAuthCallbackUrl, resolveAuthUrl } from "@/lib/auth/nextauth-url";
import { checkGmailAuthEnv } from "@/lib/env/gmail-auth";
import { isSupabaseConfigured } from "@/lib/supabase-admin";
import { getConfiguredRazorpayPlanIds } from "@/lib/billing/razorpay-plans";
import { RAZORPAY_CONNECTED } from "@/lib/billing/config";

export async function GET() {
  const gmailEnv = checkGmailAuthEnv();
  const razorpayPlans = getConfiguredRazorpayPlanIds();

  const checks = {
    auth: {
      googleClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
      googleClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
      nextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
      nextAuthUrl: process.env.NEXTAUTH_URL ?? resolveAuthUrl(),
      googleOAuthCallback: getGoogleOAuthCallbackUrl(),
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? resolveAuthUrl(),
    },
    supabase: {
      configured: isSupabaseConfigured(),
      url: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      serviceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    gmail: gmailEnv,
    razorpay: {
      connected: RAZORPAY_CONNECTED,
      keyId: Boolean(process.env.RAZORPAY_KEY_ID),
      keySecret: Boolean(process.env.RAZORPAY_KEY_SECRET),
      webhookSecret: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
      plans: razorpayPlans,
    },
  };

  const ok =
    checks.auth.googleClientId &&
    checks.auth.googleClientSecret &&
    checks.auth.nextAuthSecret &&
    checks.supabase.configured &&
    checks.gmail.ok &&
    (!checks.razorpay.connected ||
      (checks.razorpay.keyId &&
        checks.razorpay.keySecret &&
        checks.razorpay.webhookSecret &&
        Object.values(checks.razorpay.plans).every(Boolean)));

  return NextResponse.json(
    { ok, checks, timestamp: new Date().toISOString() },
    { status: ok ? 200 : 503 }
  );
}
