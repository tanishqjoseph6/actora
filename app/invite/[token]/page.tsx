"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Users } from "lucide-react";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

type InvitePreview = {
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  workspaceName: string;
  invitedBy: string;
};

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const res = await fetch(`/api/invites/${token}`);
        const data = (await res.json()) as {
          invitation?: InvitePreview;
          error?: string;
        };
        if (!res.ok || !data.invitation) {
          setError(data.error ?? "Invitation not found.");
          return;
        }
        setInvite(data.invitation);
      } catch {
        setError("Could not load invitation.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const accept = async () => {
    if (!token) return;
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch("/api/workspaces/invitations/accept", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not accept invitation.");
        return;
      }
      setAccepted(true);
      window.setTimeout(() => router.push("/dashboard"), 1200);
    } catch {
      setError("Accept failed. Please try again.");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#0A0A0A] px-5 py-16 text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.18),transparent_55%)]"
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative w-full max-w-md overflow-hidden rounded-[24px] border border-white/[0.08] ${dashboard.card} p-8 shadow-2xl`}
      >
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#3B82F6]/25 bg-[#3B82F6]/10 text-[#3B82F6]">
          {accepted ? (
            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
          ) : (
            <Users className="h-7 w-7" />
          )}
        </div>

        <p className="text-center text-xs font-medium uppercase tracking-[0.16em] text-[#3B82F6]">
          Actora
        </p>
        <h1 className="mt-2 text-center text-2xl font-semibold tracking-tight">
          {accepted ? "You're in" : "You're invited"}
        </h1>
        <p className="mt-2 text-center text-sm text-[#A1A1AA]">
          Where conversations become execution.
        </p>

        {loading && (
          <div className="mt-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#3B82F6]" />
          </div>
        )}

        {!loading && invite && (
          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A0A]/70 p-4 text-sm">
              <p className="text-[#71717A]">Workspace</p>
              <p className="mt-1 font-medium text-white">{invite.workspaceName}</p>
              <p className="mt-3 text-[#71717A]">Role</p>
              <p className="mt-1 capitalize text-white">{invite.role}</p>
              <p className="mt-3 text-[#71717A]">Invited by</p>
              <p className="mt-1 text-white">{invite.invitedBy}</p>
              <p className="mt-3 text-xs text-[#52525B]">
                Status: {invite.status}
                {invite.status === "pending"
                  ? ` · expires ${new Date(invite.expiresAt).toLocaleDateString()}`
                  : ""}
              </p>
            </div>

            {invite.status !== "pending" && !accepted && (
              <p className="text-center text-sm text-amber-300">
                This invitation is {invite.status}.
              </p>
            )}

            {error && (
              <p className="text-center text-sm text-red-300">{error}</p>
            )}

            {sessionStatus === "authenticated" &&
              invite.status === "pending" &&
              !accepted && (
                <button
                  type="button"
                  disabled={accepting}
                  onClick={() => void accept()}
                  className={`${dashboard.btnPrimary} w-full py-3 text-sm`}
                >
                  {accepting ? "Joining…" : "Accept invitation"}
                </button>
              )}

            {sessionStatus !== "authenticated" && invite.status === "pending" && (
              <div className="space-y-2">
                <Link
                  href={`/signup?invite=${token}`}
                  className={`${dashboard.btnPrimary} flex w-full items-center justify-center py-3 text-sm`}
                >
                  Create account to join
                </Link>
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}
                  className={`${dashboard.btnSecondary} flex w-full items-center justify-center py-3 text-sm`}
                >
                  Sign in
                </Link>
              </div>
            )}

            {accepted && (
              <p className="text-center text-sm text-emerald-300">
                Redirecting to your workspace…
              </p>
            )}
          </div>
        )}

        {!loading && !invite && (
          <p className="mt-8 text-center text-sm text-red-300">
            {error ?? "Invitation not found."}
          </p>
        )}
      </motion.div>
    </main>
  );
}
