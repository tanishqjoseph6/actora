import Image from "next/image";
import Link from "next/link";

type ActoraLogoProps = {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  href?: string;
  wordmarkClassName?: string;
  priority?: boolean;
};

export function ActoraLogo({
  size = 32,
  showWordmark = true,
  className = "",
  href,
  wordmarkClassName = "font-bold text-white tracking-tight",
  priority = false,
}: ActoraLogoProps) {
  const content = (
    <span className={`inline-flex items-center gap-2.5 min-w-0 ${className}`}>
      <Image
        src="/icon.png"
        alt="Actora"
        width={size}
        height={size}
        className="shrink-0"
        priority={priority}
      />
      {showWordmark && (
        <span className={`truncate ${wordmarkClassName}`}>Actora</span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex min-w-0">
        {content}
      </Link>
    );
  }

  return content;
}
