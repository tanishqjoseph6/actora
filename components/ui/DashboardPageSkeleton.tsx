import { Skeleton, SkeletonListRows } from "@/components/ui/Skeleton";

export function DashboardPageSkeleton({
  statCards = 4,
  showTable = true,
  rows = 5,
  showHero = true,
  showWidgets = false,
  showBottomGrid = false,
}: {
  statCards?: number;
  showTable?: boolean;
  rows?: number;
  showHero?: boolean;
  showWidgets?: boolean;
  showBottomGrid?: boolean;
}) {
  return (
    <div className="space-y-6 lg:space-y-8" aria-busy="true" aria-label="Loading page">
      {showHero && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-72 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
          <div className="flex flex-wrap gap-2 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-28 rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {!showHero && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-56 max-w-full" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
      )}

      {statCards > 0 && (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 ${
            statCards >= 7 ? "md:grid-cols-3 xl:grid-cols-7" : "lg:grid-cols-4"
          }`}
        >
          {Array.from({ length: statCards }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#1E293B] bg-[#111827] p-4 sm:p-5 space-y-3"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      )}

      {showWidgets && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#1E293B] bg-[#111827] p-5 space-y-4"
            >
              <Skeleton className="h-4 w-28" />
              <SkeletonListRows rows={3} />
            </div>
          ))}
        </div>
      )}

      {showBottomGrid && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#1E293B] bg-[#111827] p-5 sm:p-6 space-y-4"
            >
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-8 w-20 rounded-full" />
                ))}
              </div>
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div
                    key={j}
                    className="flex gap-4 p-4 rounded-xl border border-[#1E293B] bg-[#0B1220]/50"
                  >
                    <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-56 max-w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showTable && (
        <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-4 sm:p-6 space-y-3">
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
          <div className="space-y-2 pt-2">
            {Array.from({ length: rows }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 p-4 rounded-xl border border-[#1E293B] bg-[#0B1220]/50"
              >
                <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56 max-w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
