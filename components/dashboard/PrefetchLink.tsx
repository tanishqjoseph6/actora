"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, type ComponentProps } from "react";

type PrefetchLinkProps = ComponentProps<typeof Link>;

export function PrefetchLink({
  href,
  prefetch = true,
  onMouseEnter,
  onFocus,
  ...props
}: PrefetchLinkProps) {
  const router = useRouter();
  const path = typeof href === "string" ? href : href.pathname ?? "";

  const warm = useCallback(() => {
    if (!path || !path.startsWith("/")) return;
    router.prefetch(path);
  }, [path, router]);

  return (
    <Link
      href={href}
      prefetch={prefetch}
      scroll={false}
      onMouseEnter={(event) => {
        warm();
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        warm();
        onFocus?.(event);
      }}
      {...props}
    />
  );
}
