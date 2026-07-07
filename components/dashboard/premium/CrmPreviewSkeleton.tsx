import { Skeleton } from "@/components/ui/Skeleton";

export function CrmPreviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-hidden>
      <Skeleton className="h-4 w-48" />
      <div className="flex flex-wrap gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-[#1E293B] bg-[#0B1220]/50"
          >
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-8 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
