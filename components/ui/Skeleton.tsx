type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`skeleton-shimmer rounded-lg ${className}`.trim()}
      aria-hidden
    />
  );
}

/** Compact shimmer block for inline button / icon loading states */
export function SkeletonInline({ className = "w-4 h-4 rounded" }: SkeletonProps) {
  return <Skeleton className={className} />;
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonListRows({
  rows = 3,
  className = "",
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <ul className={`space-y-3 ${className}`} aria-busy="true" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-start gap-3">
          <Skeleton className="h-3 w-10 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton className="h-4 w-[80%] max-w-[12rem]" />
            <Skeleton className="h-2.5 w-14" />
          </div>
        </li>
      ))}
    </ul>
  );
}
