type CrmSelectFilterProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
};

export function CrmSelectFilter({
  label,
  value,
  onChange,
  options,
}: CrmSelectFilterProps) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <label className="text-[10px] uppercase tracking-wider text-[#64748B] shrink-0">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 sm:flex-none min-w-[130px] px-3 py-2 rounded-xl bg-[#0B1220] border border-[#1E293B] text-sm text-[#94A3B8] focus:outline-none focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/20 transition-all cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#111827]">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
