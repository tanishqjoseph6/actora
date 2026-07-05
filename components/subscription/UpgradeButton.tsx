import Link from "next/link";
import type { PlanId } from "@/lib/subscription";
import { getPlanDisplayName } from "@/lib/subscription";

type UpgradeButtonProps = {
  plan?: PlanId;
  /** Show plan name in label, e.g. "Upgrade to Pro" */
  showPlan?: boolean;
  className?: string;
};

export function UpgradeButton({
  plan = "pro",
  showPlan = false,
  className = "",
}: UpgradeButtonProps) {
  const label = showPlan
    ? `Upgrade to ${getPlanDisplayName(plan)}`
    : "Upgrade";

  return (
    <Link
      href={`/billing?plan=${plan}`}
      className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-[#2563EB]/15 border border-[#2563EB]/35 text-[#93C5FD] hover:bg-[#2563EB]/25 hover:border-[#2563EB]/50 transition-colors shrink-0 ${className}`.trim()}
    >
      {label}
    </Link>
  );
}
