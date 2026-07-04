"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Completing sign-in…");

  useEffect(() => {
    const handleAuth = async () => {
      const oauthError = searchParams.get("error");
      const oauthDescription = searchParams.get("error_description");
      if (oauthError) {
        setMessage(oauthDescription ?? "Sign-in failed.");
        router.replace(`/login?error=${encodeURIComponent(oauthError)}`);
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.replace("/dashboard");
          return;
        }
        setMessage(error.message);
        router.replace("/login?error=OAuthCallback");
        return;
      }

      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (!error) {
            router.replace("/dashboard");
            return;
          }

          setMessage(error.message);
          router.replace("/login?error=OAuthCallback");
          return;
        }
      }

      router.replace("/login");
    };

    void handleAuth();
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-sm text-zinc-400">{message}</p>
    </main>
  );
}

export default function Callback() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black" />}>
      <CallbackContent />
    </Suspense>
  );
}
