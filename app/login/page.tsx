"use client";

import { signIn } from "next-auth/react";

export default function Login() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <button
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="px-6 py-3 bg-white text-black rounded-lg"
      >
        Sign in with Google
      </button>
    </main>
  );
}