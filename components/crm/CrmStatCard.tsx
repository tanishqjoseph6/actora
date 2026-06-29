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
    <div className="bg-[#081226]/80 border border-cyan-400/20 rounded-2xl sm:rounded-3xl p-4 sm:p-5 backdrop-blur-sm">
      <h3 className="text-gray-400 text-xs sm:text-sm">{title}</h3>
      <p className="text-xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#60A5FA] to-[#00CFFF] mt-1 sm:mt-2">
        {value}
      </p>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}
