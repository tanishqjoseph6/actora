import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth-options";
import { logApiError } from "@/lib/api/log-error";
import { normalizeSubscriptionUserId } from "@/lib/subscription/user-id";
import {
  isMissingWaitlistSchemaError,
  isSupabaseNetworkError,
  requireSupabaseAdmin,
} from "@/lib/supabase-admin";

const BILLING_FEATURE = "Billing";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Could not join the waitlist. Please try again.";
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const sessionEmail = session?.user?.email?.trim();

  let bodyEmail: string | undefined;

  try {
    const body = (await request.json()) as { email?: string };
    if (typeof body.email === "string" && body.email.trim()) {
      bodyEmail = body.email.trim();
    }
  } catch {
    return NextResponse.json(
      { error: "Please enter your email address." },
      { status: 400 }
    );
  }

  const email = normalizeEmail(bodyEmail ?? sessionEmail ?? "");

  if (!email) {
    return NextResponse.json(
      { error: "Please enter your email address." },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const userId = sessionEmail
    ? normalizeSubscriptionUserId(sessionEmail)
    : null;

  try {
    const supabase = requireSupabaseAdmin();

    const { data: existing, error: lookupError } = await supabase
      .from("waitlist_notifications")
      .select("id")
      .eq("email", email)
      .eq("feature", BILLING_FEATURE)
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    if (existing) {
      return NextResponse.json({ status: "already_subscribed" });
    }

    const { error: insertError } = await supabase
      .from("waitlist_notifications")
      .insert({
        email,
        user_id: userId,
        feature: BILLING_FEATURE,
      });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ status: "already_subscribed" });
      }
      throw insertError;
    }

    return NextResponse.json({ status: "subscribed" });
  } catch (error) {
    logApiError("api/waitlist/billing", error, { userId, email });

    const message = getErrorMessage(error);

    if (isMissingWaitlistSchemaError(message)) {
      return NextResponse.json(
        {
          error:
            "Waitlist is not available right now. Please try again in a moment.",
        },
        { status: 503 }
      );
    }

    if (isSupabaseNetworkError(message)) {
      return NextResponse.json(
        { error: "Connection error. Please check your network and try again." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Could not join the waitlist. Please try again." },
      { status: 500 }
    );
  }
}
