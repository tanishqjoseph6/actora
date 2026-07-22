import Link from "next/link";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

type CrmBackLinkProps = {
  href: string;
  label: string;
};

export function CrmBackLink({ href, label }: CrmBackLinkProps) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`inline-flex items-center gap-2 text-sm ${dashboard.muted} hover:text-[#93C5FD] transition-colors mb-6 group`}
    >
      <ArrowIcon className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
      {label}
    </Link>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
