import { NextResponse } from "next/server";
import { createSupabaseAnonClient } from "@/lib/supabase/create-anon-client";
import { getEmailVerificationRedirectUrl } from "@/lib/auth/email-verification";
import {
  mapSupabaseAuthError,
  validatePassword,
} from "@/lib/auth/password-reset";
import { logSupabaseProjectValidation } from "@/lib/supabase/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SignupBody = {
  email?: string;
  password?: string;
  name?: string;
};

export async function POST(request: Request) {
  logSupabaseProjectValidation("auth/signup");

  let body: SignupBody;
  try {
    body = (await request.json()) as SignupBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Please try again." },
      { status: 400 }
    );
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const name = body.name?.trim() ?? "";

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    );
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAnonClient({ persistSession: false });
    const redirectTo = getEmailVerificationRedirectUrl();

    console.log("[auth/signup] Attempting signup", {
      email,
      redirectTo,
    });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: name || undefined,
        },
      },
    });

    if (error) {
      console.error("[auth/signup] Supabase signUp failed", {
        message: error.message,
        status: error.status,
        code: (error as { code?: string }).code,
        name: error.name,
      });

      const code = (error as { code?: string }).code;
      return NextResponse.json(
        {
          error: mapSupabaseAuthError(error.message, code),
          code: code ?? null,
        },
        { status: error.status && error.status >= 400 ? error.status : 400 }
      );
    }

    // Supabase returns a user with empty identities when the email is already registered
    // and confirmation emails are enabled (anti-enumeration behavior).
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      console.warn("[auth/signup] Existing account (empty identities)", {
        email,
      });
      return NextResponse.json(
        {
          error:
            "An account with this email already exists. Try signing in, or reset your password.",
          code: "user_already_registered",
        },
        { status: 409 }
      );
    }

    if (!data.user) {
      console.error("[auth/signup] No user returned without error");
      return NextResponse.json(
        {
          error:
            "Signup did not create an account. Check Supabase Auth settings and try again.",
        },
        { status: 500 }
      );
    }

    console.log("[auth/signup] Success", {
      email,
      userId: data.user.id,
      confirmed: Boolean(data.user.email_confirmed_at),
      confirmationSentAt: data.user.confirmation_sent_at,
      hasSession: Boolean(data.session),
    });

    return NextResponse.json({
      ok: true,
      email,
      needsVerification: !data.user.email_confirmed_at,
    });
  } catch (error) {
    console.error("[auth/signup] Unexpected failure", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Signup failed unexpectedly. Please try again.",
      },
      { status: 500 }
    );
  }
}
