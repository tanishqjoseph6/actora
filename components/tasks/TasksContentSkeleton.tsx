import { Skeleton } from "@/components/ui/Skeleton";

export function TasksContentSkeleton() {
  return (
    <div
      className="rounded-2xl border border-[#1E293B] bg-[#111827] p-4 sm:p-6 lg:p-8 space-y-4"
      aria-busy="true"
      aria-label="Loading tasks"
    >
      <Skeleton className="h-10 w-full max-w-xl rounded-xl" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
      <div className="space-y-6 pt-2">
        {Array.from({ length: 3 }).map((_, group) => (
          <div key={group} className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-16" />
              <div className="flex-1 h-px bg-[#1E293B]" />
              <Skeleton className="h-3 w-6" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-4 rounded-xl border border-[#1E293B] bg-[#0B1220]/50"
                >
                  <Skeleton className="w-5 h-5 rounded shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
