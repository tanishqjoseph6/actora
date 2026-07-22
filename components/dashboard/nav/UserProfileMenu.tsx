"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  CreditCard,
  HelpCircle,
  Keyboard,
  LogOut,
  MessageSquarePlus,
  Settings,
  UserRound,
  Users,
} from "lucide-react";
import { ComingSoonBadge, useBillingPause } from "@/components/billing/BillingPauseProvider";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { useGmailAccounts } from "@/hooks/useGmailAccounts";
import { useDismissible } from "@/hooks/useDismissible";
import { KeyboardShortcutsModal } from "@/components/dashboard/nav/KeyboardShortcutsModal";
import { getPlanBadgeStyles } from "@/lib/subscription/plans";
import type { PlanId } from "@/lib/subscription/types";
import { DropdownShell } from "./DropdownShell";
import { cn } from "@/lib/utils";

export function UserProfileMenu() {
  const router = useRouter();
  const { data: session } = useSession();
  const { subscription, loading } = usePlanGate();
  const { connected: gmailConnected, primaryAccount } = useGmailAccounts();
  const { paused: billingPaused, showComingSoon } = useBillingPause();
  const [open, setOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismissible(open, close);

  const name = session?.user?.name ?? "Actora User";
  const email = session?.user?.email ?? "";
  const image = session?.user?.image ?? null;
  const initial = (name || email || "U").charAt(0).toUpperCase();

  const planId = (subscription?.planId ?? "free") as PlanId;
  const planName = loading
    ? "…"
    : subscription?.trialActive
      ? "Free Trial"
      : subscription?.planName ?? "Free";
  const planStyles = getPlanBadgeStyles(planId);

  const avatar = useMemo(() => {
    if (image) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="h-full w-full rounded-xl object-cover"
          referrerPolicy="no-referrer"
        />
      );
    }
    return initial;
  }, [image, initial]);

  const linkClass =
    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-[#A1A1AA] transition-colors hover:bg-white/[0.04] hover:text-white";

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-[#3B82F6] text-xs font-semibold uppercase text-white transition-transform hover:scale-[1.03] active:scale-[0.98]"
          title={email || "Profile"}
        >
          {avatar}
        </button>

        <DropdownShell open={open} widthClassName="w-[300px]">
          <div className="border-b border-white/[0.06] px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#3B82F6] text-sm font-semibold text-white">
                {avatar}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{name}</p>
                <p className="truncate text-xs text-[#71717A]">{email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      planStyles.badge
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", planStyles.dot)} />
                    {planName}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      gmailConnected
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-white/[0.08] bg-white/[0.03] text-[#71717A]"
                    )}
                  >
                    {gmailConnected
                      ? `Gmail · ${primaryAccount?.email.split("@")[0] ?? "connected"}`
                      : "Gmail not connected"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2">
            <Link
              href="/dashboard/settings#profile"
              scroll={false}
              onClick={close}
              className={linkClass}
            >
              <UserRound className="h-4 w-4" strokeWidth={1.75} />
              My Profile
            </Link>
            <Link
              href="/dashboard/settings#integrations"
              scroll={false}
              onClick={close}
              className={linkClass}
            >
              <Users className="h-4 w-4" strokeWidth={1.75} />
              Workspace
            </Link>
            <button
              type="button"
              onClick={() => {
                close();
                setShortcutsOpen(true);
              }}
              className={linkClass}
            >
              <Keyboard className="h-4 w-4" strokeWidth={1.75} />
              Keyboard Shortcuts
            </button>
            <Link
              href="/dashboard/settings"
              scroll={false}
              onClick={close}
              className={linkClass}
            >
              <Settings className="h-4 w-4" strokeWidth={1.75} />
              Settings
            </Link>
            <button
              type="button"
              onClick={() => {
                close();
                if (billingPaused) showComingSoon();
                else router.push("/billing", { scroll: false });
              }}
              className={cn(linkClass, "justify-between")}
            >
              <span className="inline-flex items-center gap-2.5">
                <CreditCard className="h-4 w-4" strokeWidth={1.75} />
                Billing
              </span>
              {billingPaused ? <ComingSoonBadge /> : null}
            </button>
            <a
              href="mailto:sales@useactora.com?subject=Actora%20Help"
              onClick={close}
              className={linkClass}
            >
              <HelpCircle className="h-4 w-4" strokeWidth={1.75} />
              Help Center
            </a>
            <a
              href="mailto:sales@useactora.com?subject=Actora%20Feedback"
              onClick={close}
              className={linkClass}
            >
              <MessageSquarePlus className="h-4 w-4" strokeWidth={1.75} />
              Send Feedback
            </a>
          </div>

          <div className="border-t border-white/[0.06] p-2">
            <button
              type="button"
              onClick={() => {
                close();
                void signOut({ callbackUrl: "/login" });
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-[#A1A1AA] transition-colors hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              Sign Out
            </button>
          </div>
        </DropdownShell>
      </div>

      <KeyboardShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </>
  );
}
