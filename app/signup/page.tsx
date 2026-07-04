"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";

export default function Signup() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 px-6">
      <div className="bg-zinc-900 p-8 rounded-2xl w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-3">Create your account</h1>
        <p className="text-sm text-zinc-400 mb-6">
          Actora uses Google sign-in for secure authentication and Gmail access.
        </p>
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full bg-white text-black py-3 rounded-xl font-semibold"
        >
          Continue with Google
        </button>
        <p className="text-sm text-zinc-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
