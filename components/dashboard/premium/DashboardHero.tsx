"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { dashboard } from "./dashboard-tokens";

const QUICK_ACTIONS: { href: string; label: string; primary?: boolean }[] = [
  { href: "/dashboard/connect-gmail", label: "Connect Gmail", primary: true },
  { href: "/dashboard/automations", label: "Automations" },
  { href: "/dashboard/crm", label: "Open CRM" },
  { href: "/dashboard/inbox", label: "Inbox" },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardHero() {
  const { data: session } = useSession();
  const firstName =
    session?.user?.name?.split(" ")[0] ??
    session?.user?.email?.split("@")[0] ??
    "there";

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
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
        Your workspace overview
      </h1>
      <p className={`${dashboard.muted} mt-2 text-sm sm:text-base max-w-xl`}>
        Email, CRM, automations, and insights — in one place.
      </p>

      <div className="flex flex-wrap gap-2 sm:gap-3 mt-6">
        {QUICK_ACTIONS.map((action, i) => (
          <motion.div
            key={action.href + action.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.04 }}
          >
            <Link
              href={action.href}
              className={
                action.primary
                  ? `${dashboard.btnPrimary} px-4 py-2.5 text-sm`
                  : `${dashboard.btnSecondary} px-4 py-2.5 text-sm`
              }
            >
              {action.label}
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
