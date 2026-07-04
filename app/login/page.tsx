"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

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
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 px-6">
      {errorMessage && (
        <p className="max-w-md text-center text-sm text-rose-400 bg-rose-500/10 border border-rose-400/20 rounded-lg px-4 py-3">
          {errorMessage}
        </p>
      )}
      <button
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="px-6 py-3 bg-white text-black rounded-lg font-medium"
      >
        Sign in with Google
      </button>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black" />}>
      <LoginContent />
    </Suspense>
  );
}
