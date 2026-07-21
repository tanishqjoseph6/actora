"use client";

import { PrefetchLink } from "@/components/dashboard/PrefetchLink";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { dashboard } from "./dashboard-tokens";
import { useGmailAccounts } from "@/hooks/useGmailAccounts";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardHero() {
  const { data: session } = useSession();
  const { connected, primaryAccount, loading: gmailLoading } = useGmailAccounts();

  const firstName =
    session?.user?.name?.split(" ")[0] ??
    session?.user?.email?.split("@")[0] ??
    "there";

  const quickActions = [
    connected
      ? {
          href: "/dashboard/connect-gmail",
          label: primaryAccount
            ? `Gmail · ${primaryAccount.email.split("@")[0]}`
            : "Gmail Connected",
          primary: true,
          disabled: false,
        }
      : {
          href: "/dashboard/connect-gmail",
          label: "Connect Gmail",
          primary: true,
          disabled: false,
        },
    { href: "/dashboard/automations", label: "Automations" },
    { href: "/dashboard/crm", label: "Open CRM" },
    { href: "/dashboard/inbox", label: "AI Inbox" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mb-8 lg:mb-10"
    >
      <p className={`text-sm ${dashboard.subtle} mb-2`}>
        {getGreeting()}, {firstName}
      </p>
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white leading-tight">
        Roxx AI
      </h1>
      <p className={`${dashboard.muted} mt-2 text-sm sm:text-base max-w-xl`}>
        Turn conversations into tasks, CRM updates, and workflows — automatically.
      </p>

      {!gmailLoading && connected && primaryAccount && (
        <p className={`text-xs ${dashboard.accent} mt-3`}>
          Gmail connected as {primaryAccount.email}
        </p>
      )}

      <div className="flex flex-wrap gap-2 sm:gap-3 mt-6">
        {quickActions.map((action, i) => (
          <motion.div
            key={action.href + action.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.04 }}
          >
            <PrefetchLink
              href={action.href}
              className={
                action.primary
                  ? `${dashboard.btnPrimary} px-4 py-2.5 text-sm max-w-full truncate`
                  : `${dashboard.btnSecondary} px-4 py-2.5 text-sm`
              }
            >
              {action.label}
            </PrefetchLink>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
