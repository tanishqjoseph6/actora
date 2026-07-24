"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AuthBackLink, AuthCard, AuthField } from "@/components/auth/AuthCard";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { mapSupabaseAuthError } from "@/lib/auth/password-reset";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    }).then(async (res) => {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        return { error: { message: data.error ?? "Failed to send reset email." } };
      }
      return { error: null };
    });

    setLoading(false);

    if (resetError) {
      setError(mapSupabaseAuthError(resetError.message));
      return;
    }

    setSuccess(true);
  };

  return (
    <AuthCard
      title="Reset your password"
      description="Enter the email linked to your Actora account and we'll send a reset link."
      footer={
        <>
          Remember your password?{" "}
          <AuthBackLink href="/login">Back to sign in</AuthBackLink>
        </>
      }
    >
      {success ? (
        <AuthMessage variant="success">
          If an account exists for <span className="font-medium">{email}</span>,
          you&apos;ll receive a password reset email shortly. Check your inbox and
          spam folder.
        </AuthMessage>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <AuthMessage variant="error">{error}</AuthMessage>}

          <AuthField
            id="email"
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@company.com"
            autoComplete="email"
          />

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className={`w-full ${dashboard.btnPrimary} py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? "Sending reset link…" : "Send reset link"}
          </button>
        </form>
      )}

      {success && (
        <div className="mt-6 space-y-3 text-center">
          <button
            type="button"
            onClick={() => {
              setSuccess(false);
              setEmail("");
            }}
            className={`w-full ${dashboard.btnSecondary} py-3 text-sm`}
          >
            Send to a different email
          </button>
          <p className={`text-sm ${dashboard.subtle}`}>
            <Link href="/login" className={dashboard.textLink}>
              Return to sign in
            </Link>
          </p>
        </div>
      )}
    </AuthCard>
  );
}
