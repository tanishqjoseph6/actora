export function CrmListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 p-4 sm:p-5 rounded-2xl bg-[#111827]/40 border border-blue-400/5 animate-pulse"
        >
          <div className="w-11 h-11 rounded-full bg-blue-400/10 shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="flex justify-between gap-4">
              <div className="h-4 w-32 bg-blue-400/10 rounded" />
              <div className="h-4 w-16 bg-blue-400/10 rounded hidden sm:block" />
            </div>
            <div className="h-3 w-48 bg-blue-400/10 rounded" />
            <div className="h-3 w-full max-w-md bg-blue-400/10 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CrmPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 bg-blue-400/10 rounded-xl" />
      <div className="h-12 w-full max-w-lg bg-blue-400/10 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl bg-[#0B1220]/80 border border-blue-400/10"
          />
        ))}
      </div>
      <div className="h-96 rounded-3xl bg-[#0B1220]/80 border border-blue-400/10" />
    </div>
  );
}
