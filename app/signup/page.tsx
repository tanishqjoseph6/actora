"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AuthBackLink,
  AuthCard,
  AuthDivider,
  AuthField,
} from "@/components/auth/AuthCard";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { mapVerificationError } from "@/lib/auth/email-verification";
import {
  mapSupabaseAuthError,
  validatePassword,
  validatePasswordMatch,
} from "@/lib/auth/password-reset";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter your email address.");
      return;
    }

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

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
          name: name.trim(),
        }),
      });

      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string | null;
        ok?: boolean;
        needsVerification?: boolean;
      };

      if (!res.ok || payload.error) {
        const message = payload.error
          ? mapVerificationError(
              mapSupabaseAuthError(payload.error, payload.code),
              payload.code
            )
          : `Signup failed (${res.status}). Please try again.`;
        setError(message);
        return;
      }

      router.push(
        `/verify-email?pending=1&email=${encodeURIComponent(trimmedEmail)}`
      );
    } catch (err) {
      console.error("[signup] Request failed", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not reach the signup service. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      description="Sign up with email or Google. Email accounts require verification before first sign-in."
      footer={
        <>
          Already have an account?{" "}
          <AuthBackLink href="/login">Sign in</AuthBackLink>
        </>
      }
    >
      <form onSubmit={handleEmailSignup} className="space-y-4">
        {error && <AuthMessage variant="error">{error}</AuthMessage>}

        <AuthField
          id="name"
          label="Full name"
          value={name}
          onChange={setName}
          placeholder="Alex Morgan"
          autoComplete="name"
          required={false}
        />

        <AuthField
          id="email"
          label="Work email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
          autoComplete="email"
        />

        <AuthField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          minLength={8}
        />

        <AuthField
          id="confirm-password"
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          minLength={8}
        />

        <button
          type="submit"
          disabled={
            loading || !email.trim() || !password || !confirmPassword
          }
          className={`w-full ${dashboard.btnPrimary} py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className={`text-xs ${dashboard.subtle} text-center mt-4`}>
        We&apos;ll email you a verification link after signup.
      </p>

      <AuthDivider />

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className={`w-full ${dashboard.btnSecondary} py-3 text-sm`}
      >
        Continue with Google
      </button>
    </AuthCard>
  );
}
