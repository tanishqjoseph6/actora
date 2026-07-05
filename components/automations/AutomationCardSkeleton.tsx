import { Skeleton } from "@/components/ui/Skeleton";

export function AutomationCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Loading automations">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-[20px] border border-[#1E293B] bg-[#111827]/70 p-5 space-y-4"
        >
          <div className="flex gap-3">
            <Skeleton className="w-11 h-11 rounded-[14px] shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56 max-w-full" />
              <Skeleton className="h-2.5 w-24" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full shrink-0" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#1E293B]">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="space-y-1.5">
                <Skeleton className="h-2.5 w-14" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
