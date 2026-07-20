"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  CreditCard,
  HelpCircle,
  Keyboard,
  KeyRound,
  LogOut,
  Settings,
  UserRound,
  Users,
} from "lucide-react";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { useDismissible } from "@/hooks/useDismissible";
import { DropdownShell } from "./DropdownShell";

const MENU_ITEMS = [
  { label: "My Profile", href: "/dashboard/settings", icon: UserRound },
  { label: "Workspace", href: "/dashboard/settings", icon: Users },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "API Keys", href: "/dashboard/settings", icon: KeyRound },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Keyboard Shortcuts", href: "/dashboard/settings", icon: Keyboard },
  {
    label: "Help Center",
    href: "mailto:sales@useactora.com?subject=Actora%20Help",
    icon: HelpCircle,
  },
] as const;

export function UserProfileMenu() {
  const { data: session } = useSession();
  const { subscription, loading } = usePlanGate();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismissible(open, close);

  const name = session?.user?.name ?? "Actora User";
  const email = session?.user?.email ?? "";
  const initial = (name || email || "U").charAt(0).toUpperCase();
  const planName = loading
    ? "…"
    : subscription?.trialActive
      ? "Free Trial"
      : subscription?.planName ?? "Free";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3B82F6] text-xs font-semibold uppercase text-white transition-transform hover:scale-[1.03] active:scale-[0.98]"
        title={email || "Profile"}
      >
        {initial}
      </button>

      <DropdownShell open={open} widthClassName="w-[300px]">
        <div className="border-b border-white/[0.06] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3B82F6] text-sm font-semibold text-white">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{name}</p>
              <p className="truncate text-xs text-[#71717A]">{email}</p>
              <p className="mt-1 text-[11px] font-medium text-[#93C5FD]">
                {planName}
              </p>
            </div>
          </div>
        </div>

        <div className="p-2">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const className =
              "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-[#A1A1AA] transition-colors hover:bg-white/[0.04] hover:text-white";
            if (item.href.startsWith("mailto:")) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={close}
                  className={className}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  {item.label}
                </a>
              );
            }
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={close}
                className={className}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
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
  );
}
