import { Skeleton } from "@/components/ui/Skeleton";

export function CalendarContentSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading calendar">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-48 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
      <Skeleton className="h-[420px] w-full rounded-[20px]" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-48 w-full rounded-[20px]" />
        <Skeleton className="h-48 w-full rounded-[20px]" />
      </div>
    </div>
  );
}
