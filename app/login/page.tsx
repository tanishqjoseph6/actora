"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import {
  AuthBackLink,
  AuthCard,
  AuthDivider,
  AuthField,
} from "@/components/auth/AuthCard";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { ResendVerificationEmail } from "@/components/auth/ResendVerificationEmail";
import { VerificationStatusBadge } from "@/components/auth/VerificationStatusBadge";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { mapSupabaseAuthError } from "@/lib/auth/password-reset";
import { resolveSafeCallbackUrl } from "@/lib/auth/safe-redirect";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Could not start Google sign-in. Check OAuth client configuration.",
  OAuthCallback:
    "Google sign-in callback failed. The redirect URI likely does not match this environment.",
  OAuthAccountNotLinked: "This Google account is not linked to an existing session.",
  AccessDenied: "Access was denied. Approve the requested permissions to continue.",
  Configuration: "Auth is misconfigured. Contact support.",
  RefreshAccessTokenError: "Your Google session expired. Please sign in again.",
  CredentialsSignin: "Incorrect email or password.",
  Default: "Sign-in failed. Please try again.",
};

const KNOWN_ERROR_CODES = new Set(Object.keys(ERROR_MESSAGES));

function resolveAuthErrorMessage(errorCode: string | null): string | null {
  if (!errorCode) return null;

  if (KNOWN_ERROR_CODES.has(errorCode)) {
    return ERROR_MESSAGES[errorCode];
  }

  try {
    return decodeURIComponent(errorCode);
  } catch {
    return errorCode;
  }
}

const EMAIL_NOT_CONFIRMED = "Email not confirmed";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const resetSuccess = searchParams.get("reset") === "success";
  const verifiedSuccess = searchParams.get("verified") === "success";

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(
    searchParams.get("unverified") === "1"
  );

  const oauthErrorMessage = resolveAuthErrorMessage(errorCode);
  const callbackUrl = resolveSafeCallbackUrl(searchParams.get("callbackUrl"));

  const handleEmailSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsVerification(false);

    const result = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      if (result.error === EMAIL_NOT_CONFIRMED) {
        setNeedsVerification(true);
        setError("Please verify your email before signing in.");
        return;
      }

      setError(
        mapSupabaseAuthError(
          result.error === "CredentialsSignin"
            ? "Incorrect email or password."
            : result.error
        )
      );
      return;
    }

    router.push(result?.url ?? callbackUrl);
  };

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in with email or Google to access your AI workspace."
      footer={
        <>
          New to Actora?{" "}
          <AuthBackLink href="/signup">Create an account</AuthBackLink>
        </>
      }
    >
      {verifiedSuccess && (
        <AuthMessage variant="success">
          Email verified successfully. You can now sign in.
        </AuthMessage>
      )}

      {resetSuccess && (
        <AuthMessage variant="success">
          Your password has been updated. Sign in with your new password.
        </AuthMessage>
      )}

      {oauthErrorMessage && (
        <AuthMessage variant="error">
          {oauthErrorMessage}
          {errorCode === "OAuthCallback" && (
            <span className="block mt-2 text-xs opacity-80">
              Check server logs for{" "}
              <code className="font-mono">[next-auth] OAuth callback failure details</code>.
              Local callback:{" "}
              <code className="font-mono">
                http://localhost:3000/api/auth/callback/google
              </code>
              . Production callback:{" "}
              <code className="font-mono">
                https://useactora.com/api/auth/callback/google
              </code>
              .
            </span>
          )}
        </AuthMessage>
      )}

      {needsVerification && (
        <>
          <VerificationStatusBadge status="pending" email={email || undefined} />
          <AuthMessage variant="error">
            {error ?? "Please verify your email before signing in."}
          </AuthMessage>
          <ResendVerificationEmail email={email} className="mb-6" />
          <Link
            href={`/verify-email?pending=1&email=${encodeURIComponent(email.trim())}`}
            className={`block text-center text-sm ${dashboard.textLink} mb-4`}
          >
            Open verification page
          </Link>
        </>
      )}

      <form onSubmit={handleEmailSignIn} className="space-y-4">
        {error && !needsVerification && (
          <AuthMessage variant="error">{error}</AuthMessage>
        )}

        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
          autoComplete="email"
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="password"
              className={`text-sm font-medium ${dashboard.muted}`}
            >
              Password
            </label>
            <Link href="/forgot-password" className={`text-xs ${dashboard.textLink}`}>
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            required
            className={`${dashboard.input} px-4 py-3`}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim() || !password}
          className={`w-full ${dashboard.btnPrimary} py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <AuthDivider />

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl })}
        className={`w-full ${dashboard.btnSecondary} py-3 text-sm`}
      >
        Sign in with Google
      </button>
    </AuthCard>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <main className={`min-h-screen ${dashboard.bg}`} aria-busy="true" />
      }
    >
      <LoginContent />
    </Suspense>
  );
}
