import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import type { VerificationStatus } from "@/lib/auth/email-verification";

const STATUS_CONFIG: Record<
  Exclude<VerificationStatus, "verifying">,
  { label: string; dotClass: string; textClass: string; borderClass: string }
> = {
  pending: {
    label: "Verification pending",
    dotClass: "bg-amber-400",
    textClass: "text-amber-300",
    borderClass: "border-amber-400/25 bg-amber-500/10",
  },
  verified: {
    label: "Email verified",
    dotClass: "bg-emerald-400",
    textClass: "text-emerald-300",
    borderClass: "border-emerald-400/25 bg-emerald-500/10",
  },
  error: {
    label: "Verification failed",
    dotClass: "bg-rose-400",
    textClass: "text-rose-300",
    borderClass: "border-rose-400/25 bg-rose-500/10",
  },
};

type VerificationStatusBadgeProps = {
  status: Exclude<VerificationStatus, "verifying">;
  email?: string;
};

export function VerificationStatusBadge({
  status,
  email,
}: VerificationStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div
      className={`rounded-xl border px-4 py-3 mb-6 ${config.borderClass}`}
      role="status"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-2 h-2 rounded-full ${config.dotClass}`} aria-hidden />
        <span className={`text-sm font-semibold ${config.textClass}`}>
          {config.label}
        </span>
      </div>
      {email && (
        <p className={`text-sm ${dashboard.muted} pl-4`}>
          {email}
        </p>
      )}
    </div>
  );
}
