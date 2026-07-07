"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthBackLink, AuthCard } from "@/components/auth/AuthCard";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { ResendVerificationEmail } from "@/components/auth/ResendVerificationEmail";
import { VerificationStatusBadge } from "@/components/auth/VerificationStatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import {
  isEmailVerified,
  mapVerificationError,
  type VerificationStatus,
} from "@/lib/auth/email-verification";
import { supabase } from "@/lib/supabase";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(emailParam);
  const [status, setStatus] = useState<VerificationStatus>(
    searchParams.get("pending") === "1" || emailParam ? "pending" : "verifying"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const handleVerificationCallback = async () => {
      const oauthError = searchParams.get("error");
      const oauthDescription = searchParams.get("error_description");

      if (oauthError) {
        if (active) {
          setError(oauthDescription ?? "Email verification failed.");
          setStatus("error");
        }
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        const { data, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (!active) return;

        if (exchangeError) {
          setError(mapVerificationError(exchangeError.message));
          setStatus("error");
          return;
        }

        if (isEmailVerified(data.user)) {
          setEmail(data.user?.email ?? emailParam);
          await supabase.auth.signOut();
          setStatus("verified");
          window.setTimeout(() => {
            router.replace("/login?verified=success");
          }, 2400);
          return;
        }

        setError("Your email is not verified yet. Try the link in your inbox again.");
        setStatus("error");
        return;
      }

      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!active) return;

          if (sessionError) {
            setError(mapVerificationError(sessionError.message));
            setStatus("error");
            return;
          }

          window.history.replaceState({}, "", "/verify-email");

          if (isEmailVerified(data.user)) {
            setEmail(data.user?.email ?? emailParam);
            await supabase.auth.signOut();
            setStatus("verified");
            window.setTimeout(() => {
              router.replace("/login?verified=success");
            }, 2400);
            return;
          }
        }
      }

      if (searchParams.get("pending") === "1" || emailParam) {
        setStatus("pending");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      if (session?.user && isEmailVerified(session.user)) {
        setEmail(session.user.email ?? "");
        await supabase.auth.signOut();
        setStatus("verified");
        window.setTimeout(() => {
          router.replace("/login?verified=success");
        }, 2400);
        return;
      }

      if (!emailParam) {
        setStatus("pending");
      }
    };

    void handleVerificationCallback();

    return () => {
      active = false;
    };
  }, [router, searchParams, emailParam]);

  if (status === "verifying") {
    return (
      <AuthCard
        title="Verifying your email"
        description="Confirming your verification link…"
      >
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </AuthCard>
    );
  }

  if (status === "verified") {
    return (
      <AuthCard
        title="Email verified"
        description="Your account is ready. Redirecting you to sign in…"
      >
        <VerificationStatusBadge status="verified" email={email || undefined} />
        <AuthMessage variant="success">
          Thanks for confirming your email. You can now sign in to Actora.
        </AuthMessage>
      </AuthCard>
    );
  }

  if (status === "error") {
    return (
      <AuthCard
        title="Verification problem"
        description="We couldn't confirm your email with that link."
        footer={
          <>
            <AuthBackLink href="/login">Back to sign in</AuthBackLink>
          </>
        }
      >
        <VerificationStatusBadge status="error" email={email || undefined} />
        <AuthMessage variant="error">{error}</AuthMessage>
        <ResendVerificationEmail email={email} />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Verify your email"
      description="We sent a confirmation link to your inbox. Click it to activate your account."
      footer={
        <>
          Already verified?{" "}
          <AuthBackLink href="/login">Sign in</AuthBackLink>
        </>
      }
    >
      <VerificationStatusBadge status="pending" email={email || undefined} />

      <p className={`text-sm ${dashboard.muted} mb-6 leading-relaxed`}>
        Email verification is required before you can access your Actora workspace.
        The link expires after 24 hours.
      </p>

      {!emailParam && (
        <div className="mb-4">
          <label
            htmlFor="verify-email"
            className={`block text-sm font-medium ${dashboard.muted} mb-2`}
          >
            Email address
          </label>
          <input
            id="verify-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            className={`${dashboard.input} px-4 py-3 w-full`}
          />
        </div>
      )}

      <ResendVerificationEmail email={email} />
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthCard
          title="Verifying your email"
          description="Confirming your verification link…"
        >
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </AuthCard>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
