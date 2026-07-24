import { Skeleton } from "@/components/ui/Skeleton";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

export function InboxContentSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`${dashboard.cardLg} ${compact ? "p-5 sm:p-6" : "p-5 sm:p-6 lg:p-7"} space-y-5`}
      aria-busy="true"
      aria-label="Loading inbox"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      <Skeleton className="h-10 w-full max-w-md rounded-xl" />

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      <div className="space-y-2">
        {Array.from({ length: compact ? 3 : 6 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 rounded-xl border border-white/[0.06] bg-[#0A0A0A] p-4 sm:p-5"
          >
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl sm:h-11 sm:w-11" />
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="flex justify-between gap-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-4 w-2/3 max-w-sm" />
              <Skeleton className="h-3 w-full max-w-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
