import { Skeleton } from "@/components/ui/Skeleton";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

export function AnalyticsContentSkeleton() {
  return (
    <div className="space-y-6 lg:space-y-8" aria-busy="true" aria-label="Loading analytics">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-56 max-w-full" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-xl" />
        ))}
      </div>

      <div className={`${dashboard.cardLg} p-5 sm:p-6`}>
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-3 w-full max-w-xl mb-6" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/[0.06] bg-[#111111] p-4 sm:p-5 space-y-3"
          >
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-[20px]" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[280px] w-full rounded-[20px]" />
        ))}
      </div>
    </div>
  );
}
