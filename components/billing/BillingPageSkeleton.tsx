import { Skeleton } from "@/components/ui/Skeleton";

export function BillingPageSkeleton() {
  return (
    <div className="space-y-8 lg:space-y-10" aria-busy="true" aria-label="Loading billing">
      <div className="text-center space-y-4">
        <Skeleton className="h-6 w-24 mx-auto rounded-full" />
        <Skeleton className="h-12 w-48 mx-auto max-w-full" />
        <Skeleton className="h-4 w-72 mx-auto max-w-full" />
        <div className="flex flex-col items-center gap-4 pt-2">
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-10 w-56 rounded-xl" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[24px] border border-[#1E293B] bg-[#111827]/70 p-6 sm:p-8 space-y-4"
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-12 w-full rounded-2xl" />
            <div className="space-y-2 pt-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-3 w-full" />
              ))}
            </div>
            <Skeleton className="h-11 w-full rounded-2xl" />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-[24px] border border-[#1E293B] bg-[#111827]/70 p-6 sm:p-8 space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-10 w-32 rounded-2xl" />
            <Skeleton className="h-10 w-40 rounded-2xl" />
          </div>
        </div>
        <div className="rounded-[24px] border border-[#1E293B] bg-[#111827]/70 p-6 sm:p-8 space-y-5">
          <Skeleton className="h-6 w-40" />
          <div className="grid sm:grid-cols-2 gap-6">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
