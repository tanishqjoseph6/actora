import { Skeleton } from "@/components/ui/Skeleton";

export default function ConnectGmailLoading() {
  return (
    <div className="max-w-2xl mx-auto w-full space-y-6" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-6 sm:p-8 space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-11 w-48 rounded-xl" />
      </div>
    </div>
  );
}
