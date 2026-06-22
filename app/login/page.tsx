"use client";

import { supabase } from "@/lib/supabase";

export default function Login() {
  const handleGoogleLogin = async () => {
    console.log("Google login clicked");

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/auth/callback",
      },
    });

    console.log("DATA:", data);
    console.log("ERROR:", error);

    if (error) {
      alert(error.message);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <button
        onClick={handleGoogleLogin}
        className="px-6 py-3 bg-white text-black rounded-lg"
      >
        Sign in with Google
      </button>
    </main>
  );
}