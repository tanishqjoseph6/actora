"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

export default function Signup() {
  return (
    <main className={`min-h-screen ${dashboard.bg} text-white flex flex-col items-center justify-center gap-6 px-4 sm:px-6`}>
      <div className={`w-full max-w-md ${dashboard.panelLg} text-center`}>
        <p className={`text-sm ${dashboard.accent} font-semibold uppercase tracking-wider mb-3`}>
          Actora
        </p>
        <h1 className={`${dashboard.pageTitle} mb-2`}>Create your account</h1>
        <p className={`${dashboard.muted} text-sm mb-8`}>
          Actora uses Google sign-in for secure authentication and Gmail access.
        </p>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className={`w-full ${dashboard.btnPrimary} py-3 text-sm`}
        >
          Continue with Google
        </button>

        <p className={`text-sm ${dashboard.subtle} mt-6`}>
          Already have an account?{" "}
          <Link href="/login" className={dashboard.textLink}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
