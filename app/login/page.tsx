"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Could not start Google sign-in. Check OAuth client configuration.",
  OAuthCallback: "Google sign-in callback failed. Verify redirect URIs match your environment.",
  OAuthAccountNotLinked: "This Google account is not linked to an existing session.",
  AccessDenied: "Access was denied. Approve the requested permissions to continue.",
  Configuration: "Auth is misconfigured. Contact support.",
  RefreshAccessTokenError: "Your Google session expired. Please sign in again.",
  Default: "Sign-in failed. Please try again.",
};

function LoginContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const errorMessage = errorCode
    ? (ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.Default)
    : null;

  return (
    <main className={`min-h-screen ${dashboard.bg} text-white flex flex-col items-center justify-center gap-6 px-4 sm:px-6`}>
      <div className={`w-full max-w-md ${dashboard.panelLg} text-center`}>
        <p className={`text-sm ${dashboard.accent} font-semibold uppercase tracking-wider mb-3`}>
          Actora
        </p>
        <h1 className={`${dashboard.pageTitle} mb-2`}>Welcome back</h1>
        <p className={`${dashboard.muted} text-sm mb-8`}>
          Sign in with Google to access your AI workspace.
        </p>

        {errorMessage && (
          <p className="mb-6 text-sm text-rose-400 bg-rose-500/10 border border-rose-400/20 rounded-xl px-4 py-3">
            {errorMessage}
          </p>
        )}

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className={`w-full ${dashboard.btnPrimary} py-3 text-sm`}
        >
          Sign in with Google
        </button>

        <p className={`text-sm ${dashboard.subtle} mt-6`}>
          New to Actora?{" "}
          <Link href="/signup" className={dashboard.textLink}>
            Create an account
          </Link>
        </p>
      </div>
    </main>
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
