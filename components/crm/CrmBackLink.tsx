import Link from "next/link";

type CrmBackLinkProps = {
  href: string;
  label: string;
};

export function CrmBackLink({ href, label }: CrmBackLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors mb-6 group"
    >
      <ArrowIcon className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
      {label}
    </Link>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
      />
    </svg>
  );
}
