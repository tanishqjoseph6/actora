import { Skeleton } from "@/components/ui/Skeleton";
import { SkeletonListRows } from "@/components/ui/Skeleton";

export function MeetingsContentSkeleton() {
  return (
    <div className="space-y-6 lg:space-y-8" aria-busy="true" aria-label="Loading meetings">
      <div className="rounded-2xl border border-[#1E293B] bg-[#111827] p-4 sm:p-5 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#1E293B] bg-[#0B1220] p-3 sm:p-4 min-h-[120px] sm:min-h-[140px] space-y-3"
            >
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="rounded-2xl border border-[#1E293B] bg-[#111827] p-6 space-y-4">
          <SkeletonListRows rows={4} />
        </div>
      </div>
    </div>
  );
}
