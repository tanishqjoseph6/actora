export function CrmStatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-4 sm:p-5 min-w-0">
      <h3 className="text-[#71717A] text-xs sm:text-sm truncate">{title}</h3>
      <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-white mt-1 sm:mt-2 tabular-nums truncate">
        {value}
      </p>
      {hint && <p className="text-xs text-[#71717A] mt-1 truncate">{hint}</p>}
    </div>
  );
}
