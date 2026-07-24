"use client";

import { useState } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { mapVerificationError } from "@/lib/auth/email-verification";
import { mapSupabaseAuthError } from "@/lib/auth/password-reset";

type ResendVerificationEmailProps = {
  email: string;
  className?: string;
};

export function ResendVerificationEmail({
  email,
  className = "",
}: ResendVerificationEmailProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResend = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email address to resend verification.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setError(
          mapVerificationError(
            mapSupabaseAuthError(data.error ?? "Resend failed."),
            null
          )
        );
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error("[auth] Resend verification failed", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not resend verification email. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      {error && <AuthMessage variant="error">{error}</AuthMessage>}
      {success && (
        <AuthMessage variant="success">
          Verification email sent. Check your inbox and spam folder.
        </AuthMessage>
      )}

      <button
        type="button"
        onClick={() => void handleResend()}
        disabled={loading || !email.trim()}
        className={`w-full ${dashboard.btnSecondary} py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? "Sending…" : "Resend verification email"}
      </button>
    </div>
  );
}
