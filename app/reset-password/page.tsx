"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthCard, AuthField } from "@/components/auth/AuthCard";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { Skeleton } from "@/components/ui/Skeleton";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import {
  mapSupabaseAuthError,
  validatePassword,
  validatePasswordMatch,
} from "@/lib/auth/password-reset";
import { supabase } from "@/lib/supabase";

type ResetState = "validating" | "ready" | "invalid" | "success";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<ResetState>("validating");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    const validateRecoverySession = async () => {
      const oauthError = searchParams.get("error");
      const oauthDescription = searchParams.get("error_description");

      if (oauthError) {
        if (active) {
          setError(oauthDescription ?? "This reset link is invalid or has expired.");
          setState("invalid");
        }
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (!active) return;

        if (exchangeError) {
          setError(mapSupabaseAuthError(exchangeError.message));
          setState("invalid");
          return;
        }

        setState("ready");
        return;
      }

      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const type = params.get("type");

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!active) return;

          if (sessionError) {
            setError(mapSupabaseAuthError(sessionError.message));
            setState("invalid");
            return;
          }

          if (type && type !== "recovery") {
            setError("This link is not a password recovery link.");
            setState("invalid");
            return;
          }

          window.history.replaceState({}, "", "/reset-password");
          setState("ready");
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      if (session) {
        setState("ready");
        return;
      }

      setError("This reset link is invalid or has expired. Request a new one.");
      setState("invalid");
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && active) {
        setState("ready");
        setError(null);
      }
    });

    void validateRecoverySession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    const matchError = validatePasswordMatch(password, confirmPassword);
    if (matchError) {
      setError(matchError);
      return;
    }

    setSubmitting(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setSubmitting(false);

    if (updateError) {
      setError(mapSupabaseAuthError(updateError.message));
      return;
    }

    await supabase.auth.signOut();
    setState("success");

    window.setTimeout(() => {
      router.replace("/login?reset=success");
    }, 2400);
  };

  if (state === "validating") {
    return (
      <AuthCard
        title="Verifying reset link"
        description="Hang tight while we validate your secure reset token."
      >
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </AuthCard>
    );
  }

  if (state === "invalid") {
    return (
      <AuthCard
        title="Link expired"
        description="Password reset links are single-use and expire after a short time."
        footer={
          <>
            Need a new link?{" "}
            <Link href="/forgot-password" className={dashboard.textLink}>
              Request password reset
            </Link>
          </>
        }
      >
        <AuthMessage variant="error">{error}</AuthMessage>
        <Link
          href="/forgot-password"
          className={`block w-full text-center ${dashboard.btnPrimary} py-3 text-sm`}
        >
          Request new reset link
        </Link>
      </AuthCard>
    );
  }

  if (state === "success") {
    return (
      <AuthCard
        title="Password updated"
        description="Your new password is ready. Redirecting you to sign in…"
      >
        <AuthMessage variant="success">
          Password changed successfully. You can now sign in with your new
          password.
        </AuthMessage>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set a new password"
      description="Choose a strong password with at least 8 characters."
      footer={
        <>
          <Link href="/login" className={dashboard.textLink}>
            Back to sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <AuthMessage variant="error">{error}</AuthMessage>}

        <AuthField
          id="password"
          label="New password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          minLength={8}
        />

        <AuthField
          id="confirm-password"
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          minLength={8}
        />

        <button
          type="submit"
          disabled={submitting || !password || !confirmPassword}
          className={`w-full ${dashboard.btnPrimary} py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {submitting ? "Updating password…" : "Update password"}
        </button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthCard
          title="Verifying reset link"
          description="Hang tight while we validate your secure reset token."
        >
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </AuthCard>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
