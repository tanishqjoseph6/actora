"use client";

import { useState } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import {
  getEmailVerificationRedirectUrl,
  mapVerificationError,
} from "@/lib/auth/email-verification";
import { supabase } from "@/lib/supabase";

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

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: trimmed,
      options: {
        emailRedirectTo: getEmailVerificationRedirectUrl(),
      },
    });

    setLoading(false);

    if (resendError) {
      setError(mapVerificationError(resendError.message));
      return;
    }

    setSuccess(true);
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
