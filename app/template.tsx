"use client";

import { usePathname } from "next/navigation";
import { PageTransition } from "@/components/motion/PageTransition";

/**
 * Root template animates marketing/auth routes only.
 * Dashboard keeps a single transition in DashboardPageTransition to avoid double AnimatePresence.
 */
export default function RootTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname?.startsWith("/dashboard")) {
    return children;
  }
  return <PageTransition>{children}</PageTransition>;
}
